import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Camera, Clock3, Loader2, Network, RefreshCw, ShieldCheck, Star } from 'lucide-react';
import { supabase } from './supabase';

type Survey = {
  id: string;
  length_minutes: number;
  reward_usd: number;
  conversion_rate: number;
  quality_score: number;
  rating_count: number;
  rating_average: number;
  is_top: boolean;
  webcam_required: boolean;
  entry_url: string;
};

type PortalPayload = {
  status?: string;
  count?: number;
  surveys?: Survey[];
  refresh_after_seconds?: number;
  detail?: string;
  error?: string;
};

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const readableError = (payload?: PortalPayload, fallback?: string) => {
  if (payload?.detail) return payload.detail;
  if (payload?.error === 'cpx_not_configured') return 'The survey provider is not configured yet.';
  if (payload?.error === 'managed_network_not_active') return 'Managed survey traffic is not active yet.';
  if (payload?.error === 'session_expired') return 'This secure survey session has expired. Return to the publisher app and open a new session.';
  if (payload?.error === 'session_not_found') return 'This secure survey session is invalid or has already been revoked.';
  return fallback || 'This survey session is unavailable.';
};

export default function SurveyPortal({ sessionToken }: { sessionToken: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [message, setMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef<number | null>(null);

  const loadSurveys = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setState('loading');
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke<PortalPayload>('cpx-surveys', {
        body: { session_token: sessionToken, limit: 12 },
      });
      if (error || data?.status !== 'success' || !Array.isArray(data.surveys)) {
        setState('error');
        setMessage(readableError(data, error?.message));
        return;
      }

      setSurveys(data.surveys);
      setState('ready');
      const refreshSeconds = Math.max(120, Number(data.refresh_after_seconds || 120));
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => void loadSurveys(false), refreshSeconds * 1000);
    } catch {
      setState('error');
      setMessage('The survey service could not be reached. Try again from the publisher app.');
    } finally {
      setRefreshing(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('session');
    window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    void loadSurveys(false);
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
    };
  }, [loadSurveys]);

  return <main className="min-h-screen bg-[#f7f6ef] text-slate-900">
    <header className="border-b border-emerald-950/10 bg-white/95 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-950 text-white"><Network size={20} /></div>
          <div><p className="font-serif text-xl font-black">RewardBridge Survey Portal</p><p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Secure user-specific session</p></div>
        </div>
        {state === 'ready' && <button onClick={() => void loadSurveys(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold shadow-sm disabled:opacity-60"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Refresh</button>}
      </div>
    </header>

    {state === 'loading' && <section className="flex min-h-[72vh] flex-col items-center justify-center gap-4 px-6 text-center"><Loader2 className="animate-spin text-emerald-800" size={38} /><h1 className="font-serif text-2xl font-black">Finding eligible surveys</h1><p className="max-w-md text-slate-600">Availability depends on your location, profile, and current provider inventory.</p></section>}

    {state === 'error' && <section className="mx-auto flex min-h-[72vh] max-w-xl flex-col items-center justify-center px-6 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-900"><AlertTriangle size={28} /></div><h1 className="mt-5 font-serif text-3xl font-black">Survey portal unavailable</h1><p className="mt-3 leading-7 text-slate-600">{message}</p><a href={window.location.pathname} className="mt-6 rounded-xl bg-emerald-950 px-5 py-3 font-bold text-white">Return to RewardBridge</a></section>}

    {state === 'ready' && <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-7 rounded-3xl border border-emerald-900/15 bg-emerald-950 p-5 text-white shadow-xl sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-300" /><div><h1 className="font-serif text-2xl font-black">Available opportunities</h1><p className="mt-1 text-sm leading-6 text-emerald-100">Rewards shown below are your project’s configured user reward. Completed surveys remain pending until provider validation and cash reconciliation.</p></div></div>
        <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-center sm:mt-0"><p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Available now</p><p className="mt-1 text-3xl font-black">{surveys.length}</p></div>
      </div>

      {surveys.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Clock3 className="mx-auto text-slate-400" size={30} /><h2 className="mt-4 font-serif text-2xl font-black">No surveys currently match</h2><p className="mx-auto mt-2 max-w-lg leading-7 text-slate-600">Inventory changes throughout the day. Return through your publisher app later to create a fresh secure session.</p></div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{surveys.map((survey) => <article key={survey.id} className="flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-2">{survey.is_top && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-900">Top match</span>}{survey.webcam_required && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900"><Camera size={12} /> Webcam</span>}</div><span className="font-serif text-2xl font-black text-emerald-950">{currency.format(survey.reward_usd)}</span></div>
        <h2 className="mt-5 font-serif text-xl font-black">Survey opportunity</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Estimated time</p><p className="mt-1 flex items-center gap-1.5 font-black"><Clock3 size={15} /> {survey.length_minutes} min</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Conversion</p><p className="mt-1 font-black">{Math.round(survey.conversion_rate)}%</p></div></div>
        {survey.rating_count > 0 && <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-600"><Star size={15} className="fill-current text-amber-500" /> {survey.rating_average.toFixed(1)} from {survey.rating_count} ratings</p>}
        <p className="mt-4 text-xs leading-5 text-slate-500">Eligibility is determined by the survey provider. Starting a survey does not guarantee completion or payment.</p>
        <a href={survey.entry_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-4 py-3 font-bold text-white hover:bg-emerald-900">Start survey <ArrowUpRight size={17} /></a>
      </article>)}</div>}
    </section>}
  </main>;
}
