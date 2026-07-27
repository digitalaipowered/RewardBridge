-- RewardBridge production repair: 2026-07-27
-- Reproducible schema and function changes only. No generated production IDs or secrets.

alter table public.publisher_projects
  drop constraint if exists publisher_projects_user_reward_share_pct_check;

alter table public.publisher_projects
  alter column user_reward_share_pct type numeric(9,6)
  using user_reward_share_pct::numeric(9,6),
  alter column user_reward_share_pct set default 69.230769;

alter table public.publisher_projects
  add constraint publisher_projects_user_reward_share_pct_check
  check (user_reward_share_pct = 69.230769);

create unique index if not exists publisher_projects_publisher_app_url_unique
on public.publisher_projects(publisher_id, lower(app_url));

create or replace function public.create_publisher_project(
  p_name text,
  p_app_url text,
  p_allowed_origins text[],
  p_user_payout_min_usd numeric,
  p_user_reward_share_pct numeric
)
returns table(project_id uuid, public_key text, cpx_subid text)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_publisher public.publisher_accounts;
  v_project_id uuid := gen_random_uuid();
  v_public_key text := 'rb_pk_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_slug text;
  v_subid text;
  v_app_url text := trim(p_app_url);
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;

  select * into v_publisher
  from public.publisher_accounts
  where user_id=auth.uid();

  if v_publisher.id is null then raise exception 'publisher application required'; end if;
  if v_publisher.status <> 'approved' then raise exception 'publisher approval required'; end if;
  if nullif(trim(p_name),'') is null then raise exception 'project name required'; end if;
  if v_app_url !~* '^https://[^[:space:]]+$' then raise exception 'valid HTTPS app URL required'; end if;
  if p_user_payout_min_usd is null or p_user_payout_min_usd < 2 then
    raise exception 'end-user payout minimum cannot be below $2';
  end if;
  if exists (
    select 1 from public.publisher_projects
    where publisher_id=v_publisher.id and lower(app_url)=lower(v_app_url)
  ) then
    raise exception 'a project for this app URL already exists';
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(trim(p_name),'[^a-zA-Z0-9]+','-','g')))
            || '-' || substr(replace(v_project_id::text,'-',''),1,8);
  v_subid := 'rbp_' || substr(replace(v_project_id::text,'-',''),1,20);

  insert into public.publisher_projects(
    id,publisher_id,name,slug,app_url,public_key,allowed_origins,
    user_payout_min_usd,user_reward_share_pct,cpx_subid,status
  ) values (
    v_project_id,v_publisher.id,trim(p_name),v_slug,v_app_url,v_public_key,
    coalesce(p_allowed_origins,array[v_app_url]),p_user_payout_min_usd,
    69.230769,v_subid,'pending_review'
  );

  return query select v_project_id,v_public_key,v_subid;
end;
$$;

revoke all on function public.create_publisher_project(text,text,text[],numeric,numeric)
from public,anon;
grant execute on function public.create_publisher_project(text,text,text[],numeric,numeric)
to authenticated;

create or replace function public.set_publisher_paypal_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_publisher_id uuid;
  v_method_id uuid;
  v_email text := lower(trim(coalesce(p_email,'')));
  v_local text;
  v_domain text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;

  v_local := split_part(v_email,'@',1);
  v_domain := split_part(v_email,'@',2);
  if length(v_email) > 254
     or v_email like '% %'
     or v_local = ''
     or v_domain = ''
     or split_part(v_email,'@',3) <> ''
     or position('.' in v_domain) = 0
     or left(v_domain,1) in ('.','-')
     or right(v_domain,1) in ('.','-')
     or v_domain like '%..%'
     or v_local like '.%'
     or v_local like '%.'
  then
    raise exception 'valid PayPal email required';
  end if;

  select id into v_publisher_id
  from public.publisher_accounts
  where user_id=auth.uid();
  if v_publisher_id is null then raise exception 'publisher not found'; end if;

  select id into v_method_id
  from public.payout_methods
  where recipient_type='publisher'
    and publisher_id=v_publisher_id
    and method='paypal'
    and lower(destination_ref)=v_email
    and status in ('pending','verified')
  order by updated_at desc
  limit 1;

  if v_method_id is null then
    update public.payout_methods
    set status='disabled',updated_at=now()
    where recipient_type='publisher'
      and publisher_id=v_publisher_id
      and method='paypal'
      and status<>'disabled';

    insert into public.payout_methods(
      recipient_type,publisher_id,method,destination_ref,status
    ) values (
      'publisher',v_publisher_id,'paypal',v_email,'pending'
    ) returning id into v_method_id;
  end if;

  update public.payout_requests
  set status='review',payout_method_id=null,destination_method=null,destination_snapshot=null,
      approved_at=null,approved_by=null
  where recipient_type='publisher'
    and publisher_id=v_publisher_id
    and status in ('review','queued','processing');

  insert into public.payout_request_events(
    payout_request_id,publisher_id,event_type,from_status,to_status,metadata
  )
  select id,publisher_id,'destination_submitted',status,'review',
         jsonb_build_object('payout_method_id',v_method_id)
  from public.payout_requests
  where recipient_type='publisher'
    and publisher_id=v_publisher_id
    and status='review';

  return v_method_id;
end;
$$;

revoke all on function public.set_publisher_paypal_email(text)
from public,anon;
grant execute on function public.set_publisher_paypal_email(text)
to authenticated;

update public.platform_settings
set managed_network_enabled=true,
    updated_at=now()
where id=true and cpx_app_id=34813;

update public.publisher_accounts
set cpx_network_status='active',updated_at=now()
where status='approved';
