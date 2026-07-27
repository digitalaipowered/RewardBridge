import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { WORKER_BASE } from './config';
import { AlertTriangle, CheckCircle, Code, Copy, DollarSign, ExternalLink, Loader2, Lock, LogOut, Mail, Network, Plus, Settings, ShieldCheck, Users, Wallet } from 'lucide-react';
import { supabase } from './supabase';

type PublisherAccount = { id: string; legal_name: string; display_name: string; contact_email: string; country_code: string; status: string; cpx_network_status: string; publisher_payout_min_usd: number };
type Project = { id: string; name: string; app_url: string; status: string; public_key: string; user_payout_min_usd: number; user_reward_share_pct: number; platform_fee_pct: number; risk_reserve_pct: number; cpx_subid: string };
type LedgerEntry = { id: string; account_scope: string; entry_type: string; amount_usd: number; balance_state: string; created_at: string };
type PayoutRequest = { id: string; amount_usd: number; status: string; requested_at: string };
type PayoutMethod = { id: string; method: string; destination_ref: string; status: string; created_at: string };
type OwnerData = { publishers: PublisherAccount[]; projects: Project[] };
type PlatformStatus = { managedNetworkEnabled: boolean; publisherPayoutMinimum: number; userPayoutFloor: number; activation: string };

const OWNER_EMAIL = 'claytondsmith1011@gmail.com';
const TERMS_VERSION = '2026-07-26';
const AGREEMENT_VERSION = '2026-07-26';

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

function StatusPill({ value }: { value: string }) {
  const positive = ['approved', 'active', 'paid'].includes(value);
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${positive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{positive ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}{label(value)}</span>;
}

function RewardBridgeApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [account, setAccount] = useState<PublisherAccount | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [ownerData, setOwnerData] = useState<OwnerData>({ publishers: [], projects: [] });
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>({ managedNetworkEnabled: false, publisherPayoutMinimum: 25, userPayoutFloor: 2, activation: 'CPX approval required' });
  const [applyForm, setApplyForm] = useState({ legalName: '', displayName: '', contactEmail: '', countryCode: 'US', terms: false, operator: false });
  const [projectForm, setProjectForm] = useState({ name: '', url: '', payoutMin: '5.00', userShare: '70' });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [portalSessionToken] = useState(() => new URLSearchParams(window.location.search).get('session') || '');
  const [portalState, setPortalState] = useState<{ status: 'loading' | 'ready' | 'error'; embedUrl?: string; message?: string }>({ status: 'loading' });

  useEffect(() => {
    const loadPlatformStatus = async () => {
      try {
        const response = await fetch(`${WORKER_BASE}/rewardbridge/api/platform-status`, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('worker status unavailable');
        const data = await response.json() as PlatformStatus;
        setPlatformStatus(data);
      } catch {
        const { data } = await supabase.from('platform_settings').select('managed_network_enabled,publisher_payout_min_usd,user_payout_floor_usd').eq('id', true).maybeSingle();
        if (data) setPlatformStatus({ managedNetworkEnabled: Boolean(data.managed_network_enabled), publisherPayoutMinimum: Number(data.publisher_payout_min_usd), userPayoutFloor: Number(data.user_payout_floor_usd), activation: data.managed_network_enabled ? 'Enabled' : 'CPX approval required' });
      }
    };
    void loadPlatformStatus();
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthLoading(false); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    if (!session) return;
    setLoading(true);
    setNotice('');
    try {
      const { data: publisher, error: publisherError } = await supabase.from('publisher_accounts').select('*').maybeSingle();
      if (publisherError) throw publisherError;
      setAccount(publisher as PublisherAccount | null);
      if (publisher) {
        const [projectsResult, ledgerResult, payoutsResult, methodsResult] = await Promise.all([
          supabase.from('publisher_projects').select('*').eq('publisher_id', publisher.id).order('created_at', { ascending: false }),
          supabase.from('ledger_entries').select('*').eq('publisher_id', publisher.id).order('created_at', { ascending: false }).limit(100),
          supabase.from('payout_requests').select('*').eq('publisher_id', publisher.id).order('requested_at', { ascending: false }).limit(50),
          supabase.from('payout_methods').select('*').eq('publisher_id', publisher.id).order('created_at', { ascending: false })
        ]);
        if (projectsResult.error) throw projectsResult.error;
        if (ledgerResult.error) throw ledgerResult.error;
        if (payoutsResult.error) throw payoutsResult.error;
        if (methodsResult.error) throw methodsResult.error;
        setProjects((projectsResult.data || []) as Project[]);
        setLedger((ledgerResult.data || []) as LedgerEntry[]);
        setPayouts((payoutsResult.data || []) as PayoutRequest[]);
        setPayoutMethods((methodsResult.data || []) as PayoutMethod[]);
      } else {
        setProjects([]); setLedger([]); setPayouts([]); setPayoutMethods([]);
      }
      if (session.user.email === OWNER_EMAIL) {
        const [publishersResult, allProjectsResult] = await Promise.all([
          supabase.from('publisher_accounts').select('*').order('created_at', { ascending: false }),
          supabase.from('publisher_projects').select('*').order('created_at', { ascending: false })
        ]);
        if (publishersResult.error) throw publishersResult.error;
        if (allProjectsResult.error) throw allProjectsResult.error;
        setOwnerData({ publishers: (publishersResult.data || []) as PublisherAccount[], projects: (allProjectsResult.data || []) as Project[] });
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (session) void loadData(); else { setAccount(null); setProjects([]); setLedger([]); } }, [session]);

  useEffect(() => {
    if (!portalSessionToken) return;
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('session');
    window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    supabase.functions.invoke('survey-portal', { body: { session_token: portalSessionToken } }).then(({ data, error }) => {
      if (error || !data?.embed_url) {
        const message = data?.detail || data?.error || error?.message || 'This survey session is unavailable.';
        setPortalState({ status: 'error', message });
        return;
      }
      setPortalState({ status: 'ready', embedUrl: data.embed_url });
    }).catch(() => setPortalState({ status: 'error', message: 'This survey session is unavailable.' }));
  }, [portalSessionToken]);

  const availableBalance = useMemo(() => ledger.filter(item => item.balance_state === 'available').reduce((sum, item) => sum + Number(item.amount_usd), 0), [ledger]);
  const pendingBalance = useMemo(() => ledger.filter(item => item.balance_state === 'pending').reduce((sum, item) => sum + Number(item.amount_usd), 0), [ledger]);

  const sendMagicLink = async () => {
    setNotice('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setNotice('Enter a valid email address. Personal email addresses are accepted.'); return; }
    setLoading(true);
    const redirect = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    setLoading(false);
    setNotice(error ? error.message : 'Check your email for the secure sign-in link.');
  };

  const applyAsPublisher = async () => {
    setNotice('');
    if (!applyForm.terms || !applyForm.operator) { setNotice('Both agreements must be accepted before submitting.'); return; }
    setLoading(true);
    const { error } = await supabase.rpc('apply_as_publisher', {
      p_legal_name: applyForm.legalName,
      p_display_name: applyForm.displayName,
      p_contact_email: applyForm.contactEmail,
      p_country_code: applyForm.countryCode.toUpperCase(),
      p_terms_version: TERMS_VERSION,
      p_operator_agreement_version: AGREEMENT_VERSION
    });
    setLoading(false);
    if (error) { setNotice(error.message); return; }
    setNotice('Publisher application submitted for review.');
    await loadData();
  };

  const createProject = async () => {
    setNotice('');
    const payoutMin = Number(projectForm.payoutMin);
    const userShare = Number(projectForm.userShare);
    if (!projectForm.name.trim() || !projectForm.url.startsWith('https://')) { setNotice('Enter a project name and a valid HTTPS app URL.'); return; }
    if (payoutMin < platformStatus.userPayoutFloor) { setNotice(`End-user payout minimum cannot be below ${money(platformStatus.userPayoutFloor)}.`); return; }
    setLoading(true);
    const { error } = await supabase.rpc('create_publisher_project', {
      p_name: projectForm.name,
      p_app_url: projectForm.url,
      p_allowed_origins: [projectForm.url],
      p_user_payout_min_usd: payoutMin,
      p_user_reward_share_pct: userShare
    });
    setLoading(false);
    if (error) { setNotice(error.message); return; }
    setProjectForm({ name: '', url: '', payoutMin: '5.00', userShare: '70' });
    setShowProjectForm(false);
    setNotice('Project created in review status. CPX traffic remains disabled until platform and CPX approval.');
    await loadData();
  };

  const copy = async (value: string) => { await navigator.clipboard.writeText(value); setNotice('Copied to clipboard.'); };
  const generateSecretKey = async (projectId: string) => {
    setLoading(true); setNotice('');
    const { data, error } = await supabase.functions.invoke('project-api-key', { body: { project_id: projectId } });
    setLoading(false);
    if (error || !data?.api_key) { setNotice(data?.error || error?.message || 'Unable to create API key.'); return; }
    setGeneratedKey(data.api_key);
  };
  const savePaypalEmail = async () => {
    setNotice('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(paypalEmail)) { setNotice('Enter a valid PayPal email address.'); return; }
    setLoading(true);
    const { error } = await supabase.rpc('set_publisher_paypal_email', { p_email: paypalEmail });
    setLoading(false);
    if (error) { setNotice(error.message); return; }
    setPaypalEmail(''); setNotice('PayPal destination submitted for owner verification.'); await loadData();
  };
  const approvePublisher = async (publisherId: string) => {
    setLoading(true);
    const { error } = await supabase.rpc('admin_set_publisher_status', { p_publisher_id: publisherId, p_status: 'approved', p_cpx_network_status: 'disabled_pending_cpx_approval', p_request_id: crypto.randomUUID() });
    setLoading(false); setNotice(error ? error.message : 'Publisher approved. CPX access remains locked.'); if (!error) await loadData();
  };
  const approveProject = async (projectId: string) => {
    setLoading(true);
    const { error } = await supabase.rpc('admin_set_project_status', { p_project_id: projectId, p_status: 'approved', p_request_id: crypto.randomUUID() });
    setLoading(false); setNotice(error ? error.message : 'Project approved for configuration. Managed traffic remains locked.'); if (!error) await loadData();
  };
  const signOut = async () => { await supabase.auth.signOut(); setNotice('Signed out.'); };

  if (portalSessionToken) return <main className="min-h-screen bg-[#f7f6ef] text-slate-900"><header className="border-b border-emerald-950/10 bg-white px-4 py-3"><div className="mx-auto flex max-w-6xl items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-950 text-white"><Network size={20} /></div><div><p className="font-serif text-xl font-black">RewardBridge Survey Portal</p><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Secure hosted session</p></div></div></header>{portalState.status === 'loading' && <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center"><Loader2 className="animate-spin text-emerald-800" size={36} /><p className="font-bold">Validating your survey session…</p></div>}{portalState.status === 'error' && <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-900"><AlertTriangle size={28} /></div><h1 className="mt-5 font-serif text-3xl font-black">Survey portal unavailable</h1><p className="mt-3 leading-7 text-slate-600">{portalState.message}</p><a href={window.location.pathname} className="mt-6 rounded-xl bg-emerald-950 px-5 py-3 font-bold text-white">Return to RewardBridge</a></div>}{portalState.status === 'ready' && portalState.embedUrl && <iframe title="RewardBridge survey portal" src={portalState.embedUrl} referrerPolicy="no-referrer" allow="camera; microphone" className="min-h-[calc(100vh-65px)] w-full border-0 bg-white" />}</main>;

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="animate-spin text-emerald-800" size={34} /></div>;

  return <main className="min-h-screen text-slate-900">
    <header className="sticky top-0 z-20 border-b border-emerald-950/10 bg-[#f7f6ef]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-950 text-white shadow-lg"><Network size={21} /></div><div><p className="font-serif text-xl font-black tracking-tight">RewardBridge</p><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800">Managed publisher network</p></div></div>
        {session ? <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold shadow-sm hover:border-slate-500"><LogOut size={16} /> Sign out</button> : <a href="#access" className="rounded-xl bg-emerald-950 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-emerald-900">Publisher access</a>}
      </div>
    </header>

    {!session ? <>
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
        <div className="self-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900"><Lock size={14} /> Controlled beta · CPX activation gated</div>
          <h1 className="max-w-3xl font-serif text-5xl font-black leading-[0.98] tracking-tight text-emerald-950 sm:text-6xl">Survey infrastructure for developers who do not want to build a financial backend.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">RewardBridge operates the hosted survey portal, tracks verified revenue, separates user liabilities from publisher margin, and prepares compliant payout queues. Personal email addresses are accepted.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="#access" className="rounded-2xl bg-emerald-950 px-6 py-3 font-bold text-white shadow-xl hover:bg-emerald-900">Apply as a publisher</a><a href="#economics" className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-bold hover:border-slate-500">Review economics</a></div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-950/15 bg-emerald-950 p-7 text-white shadow-2xl sm:p-9">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[42px] border-emerald-700/30" />
          <div className="relative"><p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Cash-control architecture</p><div className="mt-8 space-y-5">{[
            ['Provider reported', 'Tracked, never withdrawable'], ['Provider cash received', 'Reconciled against CPX payment'], ['Publisher available', `${money(platformStatus.publisherPayoutMinimum)} withdrawal minimum`], ['End-user available', `Publisher-selected threshold, floor ${money(platformStatus.userPayoutFloor)}`]
          ].map(([title, text], index) => <div key={title} className="flex gap-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-400 font-black text-emerald-950">{index + 1}</div><div><p className="font-bold">{title}</p><p className="mt-1 text-sm text-emerald-100">{text}</p></div></div>)}</div></div>
        </div>
      </section>

      <section id="economics" className="border-y border-emerald-950/10 bg-white/60"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><DollarSign className="text-emerald-800" /><p className="mt-5 text-sm font-bold uppercase tracking-wider text-slate-500">Publisher withdrawal</p><p className="mt-1 font-serif text-4xl font-black">{money(platformStatus.publisherPayoutMinimum)}</p><p className="mt-3 text-sm leading-6 text-slate-600">Fixed network minimum for cleared publisher margin.</p></article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Wallet className="text-emerald-800" /><p className="mt-5 text-sm font-bold uppercase tracking-wider text-slate-500">End-user floor</p><p className="mt-1 font-serif text-4xl font-black">{money(platformStatus.userPayoutFloor)}</p><p className="mt-3 text-sm leading-6 text-slate-600">Publishers can choose any minimum at or above this floor.</p></article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><ShieldCheck className="text-emerald-800" /><p className="mt-5 text-sm font-bold uppercase tracking-wider text-slate-500">Activation</p><p className="mt-1 font-serif text-2xl font-black">Written approval gate</p><p className="mt-3 text-sm leading-6 text-slate-600">No customer traffic reaches CPX until the managed network structure is approved.</p></article>
      </div></div></section>

      <section id="access" className="mx-auto max-w-xl px-4 py-16 sm:px-6"><div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl sm:p-9"><Mail className="text-emerald-800" size={28} /><h2 className="mt-5 font-serif text-3xl font-black">Publisher access</h2><p className="mt-2 text-slate-600">Use Gmail, Outlook, Yahoo, or another email you control. A custom-domain business email is not required.</p><label className="mt-6 block text-sm font-bold">Email address</label><input value={email} onChange={event => setEmail(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') void sendMagicLink(); }} placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-100" /><button onClick={sendMagicLink} disabled={loading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />} Send secure sign-in link</button></div></section>
    </> : <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-800">Publisher control plane</p><h1 className="mt-1 font-serif text-4xl font-black">{account?.display_name || 'Application setup'}</h1><p className="mt-2 text-slate-600">Signed in as {session.user.email}</p></div>{loading && <Loader2 className="animate-spin text-emerald-800" />}</div>

      {session.user.email === OWNER_EMAIL && <div className="mb-8 rounded-[2rem] border border-emerald-900/20 bg-emerald-950 p-6 text-white shadow-xl"><div className="flex items-center gap-3"><ShieldCheck /><div><p className="font-serif text-2xl font-black">Owner command view</p><p className="text-sm text-emerald-200">Approvals below cannot enable CPX traffic. The separate network lock remains authoritative.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase tracking-wider text-emerald-300">Publishers</p><p className="mt-1 text-3xl font-black">{ownerData.publishers.length}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase tracking-wider text-emerald-300">Projects</p><p className="mt-1 text-3xl font-black">{ownerData.projects.length}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs uppercase tracking-wider text-emerald-300">Managed traffic</p><p className="mt-2 font-bold">{platformStatus.managedNetworkEnabled ? 'Enabled' : 'Locked'}</p></div></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl bg-white/10 p-4"><p className="font-bold">Pending publishers</p><div className="mt-3 space-y-2">{ownerData.publishers.filter(item => item.status === 'pending_review').length === 0 ? <p className="text-sm text-emerald-200">No pending applications.</p> : ownerData.publishers.filter(item => item.status === 'pending_review').map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 p-3"><div><p className="font-bold">{item.display_name}</p><p className="text-xs text-emerald-200">{item.contact_email}</p></div><button onClick={() => approvePublisher(item.id)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-emerald-950">Approve account</button></div>)}</div></div><div className="rounded-2xl bg-white/10 p-4"><p className="font-bold">Pending projects</p><div className="mt-3 space-y-2">{ownerData.projects.filter(item => item.status === 'pending_review').length === 0 ? <p className="text-sm text-emerald-200">No pending projects.</p> : ownerData.projects.filter(item => item.status === 'pending_review').map(item => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/15 p-3"><div><p className="font-bold">{item.name}</p><p className="max-w-[13rem] truncate text-xs text-emerald-200">{item.app_url}</p></div><button onClick={() => approveProject(item.id)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-emerald-950">Approve setup</button></div>)}</div></div></div></div>}

      {!account ? <div className="grid gap-8 lg:grid-cols-[1fr_.8fr]"><div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-lg"><h2 className="font-serif text-3xl font-black">Publisher application</h2><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Legal name<input value={applyForm.legalName} onChange={event => setApplyForm({ ...applyForm, legalName: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">Public display name<input value={applyForm.displayName} onChange={event => setApplyForm({ ...applyForm, displayName: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">Contact email<input value={applyForm.contactEmail} onChange={event => setApplyForm({ ...applyForm, contactEmail: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">Country code<input maxLength={2} value={applyForm.countryCode} onChange={event => setApplyForm({ ...applyForm, countryCode: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal uppercase" /></label></div><div className="mt-6 space-y-4 text-sm leading-6"><label className="flex gap-3"><input type="checkbox" checked={applyForm.terms} onChange={event => setApplyForm({ ...applyForm, terms: event.target.checked })} className="mt-1" /><span>I accept the platform terms, privacy terms, fraud controls, reserve rules, and the fixed {money(platformStatus.publisherPayoutMinimum)} publisher payout minimum.</span></label><label className="flex gap-3"><input type="checkbox" checked={applyForm.operator} onChange={event => setApplyForm({ ...applyForm, operator: event.target.checked })} className="mt-1" /><span>I appoint RewardBridge as operator of the hosted survey portal and grant a limited license to distribute that portal through my application. This does not transfer ownership of my application or domain.</span></label></div><button onClick={applyAsPublisher} disabled={loading} className="mt-6 rounded-2xl bg-emerald-950 px-5 py-3 font-bold text-white disabled:opacity-60">Submit application</button></div><aside className="rounded-[2rem] border border-amber-200 bg-amber-50 p-7"><AlertTriangle className="text-amber-800" /><h3 className="mt-4 font-serif text-2xl font-black text-amber-950">Important operating boundary</h3><p className="mt-3 leading-7 text-amber-950/80">RewardBridge owns and controls its hosted survey portal. Your app remains yours. CPX access is not enabled merely because this agreement is accepted; written provider approval and project review remain mandatory.</p></aside></div> : <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Available</p><p className="mt-2 font-serif text-3xl font-black">{money(availableBalance)}</p></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending provider cash</p><p className="mt-2 font-serif text-3xl font-black">{money(pendingBalance)}</p></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Publisher status</p><div className="mt-3"><StatusPill value={account.status} /></div></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">CPX network</p><div className="mt-3"><StatusPill value={account.cpx_network_status} /></div></div></div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_.42fr]"><div><div className="flex items-center justify-between"><div><h2 className="font-serif text-3xl font-black">Projects</h2><p className="mt-1 text-sm text-slate-600">Each project gets isolated settings and attribution.</p></div><button onClick={() => setShowProjectForm(!showProjectForm)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> New project</button></div>
          {showProjectForm && <div className="mt-5 rounded-3xl border border-emerald-900/20 bg-white p-6 shadow-lg"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Project name<input value={projectForm.name} onChange={event => setProjectForm({ ...projectForm, name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">HTTPS app URL<input value={projectForm.url} onChange={event => setProjectForm({ ...projectForm, url: event.target.value })} placeholder="https://your-app.example" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">End-user payout minimum<input type="number" min="2" step="0.01" value={projectForm.payoutMin} onChange={event => setProjectForm({ ...projectForm, payoutMin: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">User share of publisher pool (%)<input type="number" min="1" max="95" value={projectForm.userShare} onChange={event => setProjectForm({ ...projectForm, userShare: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" /></label></div><button onClick={createProject} disabled={loading} className="mt-5 rounded-xl bg-emerald-950 px-4 py-2.5 font-bold text-white disabled:opacity-60">Create review project</button></div>}
          <div className="mt-5 space-y-4">{projects.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center"><Code className="mx-auto text-slate-400" /><p className="mt-3 font-bold">No projects yet</p><p className="mt-1 text-sm text-slate-500">Create one to receive project credentials and settings.</p></div> : projects.map(project => <article key={project.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-3"><h3 className="font-serif text-2xl font-black">{project.name}</h3><StatusPill value={project.status} /></div><a href={project.app_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-emerald-800">{project.app_url}<ExternalLink size={14} /></a></div><div className="flex gap-6 text-sm"><div><p className="text-slate-500">User minimum</p><p className="font-black">{money(Number(project.user_payout_min_usd))}</p></div><div><p className="text-slate-500">User share</p><p className="font-black">{Number(project.user_reward_share_pct)}%</p></div></div></div><div className="mt-5 rounded-2xl bg-slate-950 p-4 text-slate-100"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Public project key</p><code className="mt-1 block truncate text-xs sm:text-sm">{project.public_key}</code></div><button onClick={() => copy(project.public_key)} className="rounded-lg bg-white/10 p-2 hover:bg-white/20"><Copy size={16} /></button></div></div><div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={() => generateSecretKey(project.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold hover:border-emerald-700"><Lock size={15} /> Generate or rotate secret key</button><p className="text-xs text-slate-500">Rotation immediately revokes the prior key.</p></div><div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><Lock className="mt-0.5 shrink-0" size={16} /><p>A key can be prepared now, but survey sessions still fail closed until project and managed-network activation.</p></div></article>)}</div>
        </div><aside className="space-y-5"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Settings className="text-emerald-800" /><h3 className="mt-4 font-serif text-2xl font-black">Network economics</h3><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-600">Initial platform fee</dt><dd className="font-black">25%</dd></div><div className="flex justify-between"><dt className="text-slate-600">Risk reserve</dt><dd className="font-black">10%</dd></div><div className="flex justify-between"><dt className="text-slate-600">Initial publisher pool</dt><dd className="font-black">65%</dd></div><div className="flex justify-between border-t pt-3"><dt className="text-slate-600">Publisher cashout</dt><dd className="font-black">{money(platformStatus.publisherPayoutMinimum)}</dd></div></dl></div><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Wallet className="text-emerald-800" /><h3 className="mt-4 font-serif text-2xl font-black">PayPal destination</h3>{payoutMethods[0] ? <div className="mt-3 rounded-xl bg-slate-100 p-3 text-sm"><p className="truncate font-bold">{payoutMethods[0].destination_ref}</p><div className="mt-2"><StatusPill value={payoutMethods[0].status} /></div></div> : <p className="mt-2 text-sm text-slate-600">No payout destination submitted.</p>}<input value={paypalEmail} onChange={event => setPaypalEmail(event.target.value)} placeholder="PayPal email" className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /><button onClick={savePaypalEmail} className="mt-3 w-full rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-bold text-white">Submit for verification</button></div><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Users className="text-emerald-800" /><h3 className="mt-4 font-serif text-2xl font-black">Payout activity</h3><p className="mt-2 text-sm text-slate-600">{payouts.length ? `${payouts.length} payout request records.` : 'No payout requests.'}</p></div></aside></div>
      </>}
    </section>}
    <footer className="border-t border-emerald-950/10 bg-white/70 px-4 py-8 text-sm text-slate-600"><div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p>RewardBridge Network · Controlled beta · Managed CPX traffic disabled pending approval.</p><nav className="flex flex-wrap gap-x-4 gap-y-2 font-bold text-emerald-900"><a href="./privacy.html">Privacy</a><a href="./terms.html">Terms</a><a href="./publisher-agreement.html">Publisher Agreement</a><a href="./rewards-terms.html">Rewards Terms</a><a href="./contact.html">Contact</a></nav></div></footer>
    {generatedKey && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4"><div className="w-full max-w-xl rounded-[2rem] bg-white p-7 shadow-2xl"><Lock className="text-emerald-800" /><h2 className="mt-4 font-serif text-3xl font-black">Store this secret key now</h2><p className="mt-2 text-sm leading-6 text-slate-600">RewardBridge stores only its hash. Closing this window permanently hides the plaintext.</p><div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white"><code className="block break-all text-sm">{generatedKey}</code></div><div className="mt-5 flex gap-3"><button onClick={() => copy(generatedKey)} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-bold">Copy key</button><button onClick={() => setGeneratedKey('')} className="flex-1 rounded-xl bg-emerald-950 px-4 py-2.5 font-bold text-white">I stored it</button></div></div></div>}
    {notice && <div role="status" className={`fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border px-4 py-3 text-sm font-bold shadow-2xl ${notice.toLowerCase().includes('valid') || notice.toLowerCase().includes('required') || notice.toLowerCase().includes('unable') ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}>{notice}</div>}
  </main>;
}

export default RewardBridgeApp;
