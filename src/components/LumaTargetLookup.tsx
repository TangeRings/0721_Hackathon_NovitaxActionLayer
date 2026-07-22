/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, Search, Loader2, UserCheck, ChevronRight, AlertCircle, CalendarDays } from 'lucide-react';
import { DEMO_LUMA_EVENT_URL } from '../config';

interface LumaEventContext {
  name: string | null;
  description: string | null;
  startAt: string | null;
  url: string;
  mode: 'live' | 'fallback';
}

interface HostLookupResult {
  hostName: string;
  taskId: string | null;
  status: string;
  mode: 'live' | 'fallback';
  warning?: string;
  provenanceTrail: string[];
}

interface LumaTargetLookupProps {
  currentTargetName: string | null;
  onUseAsTarget: (name: string, context: { eventName: string | null; eventUrl: string }) => void;
}

export const LumaTargetLookup: React.FC<LumaTargetLookupProps> = ({ currentTargetName, onUseAsTarget }) => {
  const [eventUrl, setEventUrl] = useState(DEMO_LUMA_EVENT_URL);
  const [loading, setLoading] = useState(false);
  const [eventContext, setEventContext] = useState<LumaEventContext | null>(null);
  const [hostResult, setHostResult] = useState<HostLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!eventUrl.trim()) return;
    setLoading(true);
    setError(null);
    setEventContext(null);
    setHostResult(null);

    try {
      const [eventRes, hostRes] = await Promise.all([
        fetch('/api/luma-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventUrl }),
        }),
        fetch('/api/actionlayer/find-host', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventUrl }),
        }),
      ]);

      if (eventRes.ok) {
        setEventContext(await eventRes.json());
      }

      if (hostRes.ok) {
        setHostResult(await hostRes.json());
      } else {
        const errData = await hostRes.json().catch(() => ({}));
        throw new Error(errData.message || `ActionLayer request failed with status ${hostRes.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Luma/ActionLayer lookup failed:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-2xl">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-600" />
          Luma Event Host Lookup
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Paste a public Luma event URL. Event context comes straight from Luma&apos;s public API;
          ActionLayer browses the page (read-only) to report the first host listed. Nothing is
          contacted or sent. Real browser automation can take a couple of minutes, especially
          when ActionLayer&apos;s operator queue is busy.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={eventUrl}
          onChange={(e) => setEventUrl(e.target.value)}
          placeholder="https://lu.ma/your-event-slug"
          className="flex-grow border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none font-mono"
        />
        <button
          onClick={handleLookup}
          disabled={loading || !eventUrl.trim()}
          className="px-3 py-2 bg-slate-950 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Find Host via ActionLayer
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>Browsing the event page via a real ActionLayer browser task&mdash;this can take a few minutes.</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">ActionLayer connection error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {(eventContext || hostResult) && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-200 rounded-xl overflow-hidden"
          >
            {eventContext && (
              <div className="p-3 bg-slate-50 border-b border-slate-150 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <CalendarDays className="h-3 w-3" /> Event Context ({eventContext.mode})
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  {eventContext.name || 'Unknown event name'}
                </p>
                {eventContext.startAt && (
                  <p className="text-[10px] font-mono text-slate-500">{eventContext.startAt}</p>
                )}
              </div>
            )}

            {hostResult && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Host Found ({hostResult.mode})
                  </span>
                  {hostResult.mode === 'fallback' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-amber-100 text-amber-700">
                      Fallback
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-900">{hostResult.hostName}</span>
                  <button
                    onClick={() =>
                      onUseAsTarget(hostResult.hostName, {
                        eventName: eventContext?.name || null,
                        eventUrl,
                      })
                    }
                    disabled={currentTargetName === hostResult.hostName}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-medium rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    {currentTargetName === hostResult.hostName ? 'Active Target' : 'Use as Coordination Target'}
                  </button>
                </div>

                {hostResult.warning && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">
                    {hostResult.warning}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <h5 className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Provenance Trail
                  </h5>
                  <ul className="space-y-1">
                    {hostResult.provenanceTrail.map((trail, idx) => (
                      <li key={idx} className="text-[10px] text-slate-500 font-mono flex items-start gap-1">
                        <ChevronRight className="h-3 w-3 text-slate-300 mt-0.5 shrink-0" />
                        <span>{trail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
