/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Lightbulb, 
  Activity, 
  GraduationCap, 
  Clock, 
  X, 
  Info,
  ChevronRight,
  RotateCcw,
  RefreshCw,
  Cpu,
  Database,
  Mail, 
  FileText, 
  Sparkles, 
  Loader2,
  Link2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ActionIntent, Intersection } from '../types';

interface LiveCoordinationViewProps {
  intents: ActionIntent[];
  intersections: Intersection[];
  onSelectIntersection: (id: string) => void;
  gemmaStage: 'awaiting_scan' | 'thinking' | 'analyzed_issues' | 'recommendation' | 'resolved' | 'error';
  setGemmaStage: (stage: 'awaiting_scan' | 'thinking' | 'analyzed_issues' | 'recommendation' | 'resolved' | 'error') => void;
  gemmaLogs: string[];
  setGemmaLogs: React.Dispatch<React.SetStateAction<string[]>>;
  gemmaSelectedOption: 'both_coordinated' | 'drop_career' | null;
  setGemmaSelectedOption: (option: 'both_coordinated' | 'drop_career' | null) => void;
  /** Coordination target identity; starts as an unresolved "Guest" placeholder and is
   * replaced once ActionLayer browses the Luma event page and reports a real host. */
  targetName?: string;
  /** Public Luma event URL that the coordinated invitation is routed through instead of
   * a direct message, once the recommendation is approved. */
  lumaEventUrl?: string;
  /** Called once ActionLayer reports the first host listed on the Luma event page. */
  onHostResolved?: (name: string, context: { eventName: string | null; eventUrl: string }) => void;
}

export const LiveCoordinationView: React.FC<LiveCoordinationViewProps> = ({ 
  intents, 
  intersections, 
  onSelectIntersection,
  gemmaStage,
  setGemmaStage,
  gemmaLogs,
  setGemmaLogs,
  gemmaSelectedOption,
  setGemmaSelectedOption,
  targetName = 'Guest',
  lumaEventUrl,
  onHostResolved,
}) => {
  const [hoveredIntentId, setHoveredIntentId] = useState<string | null>(null);
  const [activeHighlightGroup, setActiveHighlightGroup] = useState<'relationship' | 'resource' | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>('Career Services');
  const [activeIntersectionId, setActiveIntersectionId] = useState<string | null>(null);

  // Agent walkthrough and visibility states
  const [secretaryVisible, setSecretaryVisible] = useState(false);
  const [hackathonVisible, setHackathonVisible] = useState(false);
  const [coordinationVisible, setCoordinationVisible] = useState(false);

  const [coordinationDetails, setCoordinationDetails] = useState<{
    logs: string[];
    conflictAnalysis: string;
    solution1: { title: string; description: string };
    solution2: { title: string; description: string };
  } | null>(null);

  const [authorizationRequest, setAuthorizationRequest] = useState<{
    to: string;
    cc: string[];
    subject: string;
    body: string;
    status: string;
    awaitingResponseFrom: string;
    sentAt?: string;
  } | null>(null);

  // Luma + ActionLayer host-routing sequence, triggered once the coordinated
  // recommendation is approved. Real, read-only ActionLayer browser task; nothing is
  // ever contacted. The "confirming" -> "confirmed" step is an explicitly simulated
  // stand-in for a human personnel confirmation loop we don't have wired up.
  const [lumaStage, setLumaStage] = useState<'idle' | 'browsing' | 'found' | 'confirming' | 'confirmed' | 'error'>('idle');
  const [lumaLogs, setLumaLogs] = useState<string[]>([]);
  const [foundHostName, setFoundHostName] = useState<string | null>(null);
  const [lumaError, setLumaError] = useState<string | null>(null);
  const lumaTriggeredRef = useRef(false);

  const runLumaRoutingSequence = useCallback(async () => {
    if (!lumaEventUrl) return;
    setLumaStage('browsing');
    setLumaError(null);
    setLumaLogs([
      `[BlueQ] Coordinated invitation approved. Routing outreach through the event's Luma page instead of a direct message.`,
      `[ActionLayer] Browsing ${lumaEventUrl} (read-only) to identify the event host. Real browser automation — this can take a few minutes.`,
    ]);

    try {
      const [eventRes, hostRes] = await Promise.all([
        fetch('/api/luma-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventUrl: lumaEventUrl }),
        }),
        fetch('/api/actionlayer/find-host', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventUrl: lumaEventUrl }),
        }),
      ]);

      const eventName = eventRes.ok ? (await eventRes.json()).name ?? null : null;

      if (!hostRes.ok) {
        const errData = await hostRes.json().catch(() => ({}));
        throw new Error(errData.message || `ActionLayer request failed with status ${hostRes.status}`);
      }

      const hostData = await hostRes.json();
      const hostName: string = hostData.hostName;

      setFoundHostName(hostName);
      setLumaStage('found');
      setLumaLogs(prev => [...prev, `[ActionLayer] Located first host listed: ${hostName}.`]);
      onHostResolved?.(hostName, { eventName, eventUrl: lumaEventUrl });

      setLumaStage('confirming');
      setLumaLogs(prev => [
        ...prev,
        `[BlueQ] Sent confirmation request to event personnel before proceeding with ${hostName}.`,
      ]);

      await new Promise(resolve => setTimeout(resolve, 1600));

      setLumaStage('confirmed');
      setLumaLogs(prev => [
        ...prev,
        `[BlueQ] (Simulated) Confirmation received — approved to proceed with ${hostName}.`,
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Luma/ActionLayer host routing failed:', msg);
      setLumaError(msg);
      setLumaStage('error');
      setLumaLogs(prev => [...prev, `[ERROR] ActionLayer host lookup failed — ${msg}`]);
    }
  }, [lumaEventUrl, onHostResolved]);

  // Kick off the Luma routing sequence exactly once, the first time the recommendation
  // is approved and the authorization request has been sent.
  useEffect(() => {
    if (gemmaStage === 'resolved' && !lumaTriggeredRef.current) {
      lumaTriggeredRef.current = true;
      runLumaRoutingSequence();
    }
    if (gemmaStage === 'awaiting_scan') {
      // Demo reset: allow the sequence to run again on the next walkthrough.
      lumaTriggeredRef.current = false;
      setLumaStage('idle');
      setLumaLogs([]);
      setFoundHostName(null);
      setLumaError(null);
    }
  }, [gemmaStage, runLumaRoutingSequence]);

  const [timestamps, setTimestamps] = useState<{
    issue: string;
    coordination: string;
    action: string;
  }>({
    issue: '12:47',
    coordination: '12:48',
    action: '12:49',
  });

  // Group intents by domain
  const domainsList = [
    { name: 'Career Services', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    { name: 'Innovation Lab', icon: Lightbulb, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
    { name: 'AI Research Center', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
    { name: 'Course Domains', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
  ] as const;

  const getDomainIntents = (domainName: string) => {
    return intents.filter(intent => intent.domain === domainName);
  };

  // Check if an intent belongs to a specific intersection grouping
  const isIntentInIntersection = (intentId: string, type: 'relationship' | 'resource') => {
    if (type === 'relationship') {
      return ['intent-careers-1', 'intent-lab-1', 'intent-research-1'].includes(intentId);
    } else {
      return ['intent-course-analytics', 'intent-course-discovery'].includes(intentId);
    }
  };

  const handleDomainClick = (domainName: string) => {
    setSelectedDomain(domainName);
    const laneId = `lane-${domainName.toLowerCase().replace(/\s+/g, '-')}`;
    document.getElementById(laneId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const triggerHighlight = (type: 'relationship' | 'resource') => {
    setActiveHighlightGroup(type);
    setActiveIntersectionId(type === 'relationship' ? 'intersection-relationship' : 'intersection-resource');
  };

  // Sequential walkthrough trigger
  const startWalkthroughSequence = useCallback(async () => {
    // 1. Reset all state parameters
    setSecretaryVisible(false);
    setHackathonVisible(false);
    setCoordinationVisible(false);
    setGemmaStage('awaiting_scan');
    setGemmaLogs([]);
    setGemmaSelectedOption(null);
    setCoordinationDetails(null);
    setAuthorizationRequest(null);

    const now = new Date();
    const formatTime = (date: Date) => {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    };

    setTimestamps({
      issue: formatTime(now),
      coordination: formatTime(new Date(now.getTime() + 2000)),
      action: formatTime(new Date(now.getTime() + 4000))
    });

    // 2. Step 1: Slide in Secretary Agent (Career Services) after 400ms
    const t1 = setTimeout(() => {
      setSecretaryVisible(true);
    }, 400);

    // 3. Step 2: Slide in Hackathon Agent (Innovation Lab) after 1500ms
    const t2 = setTimeout(() => {
      setHackathonVisible(true);
    }, 1500);

    // 4. Step 3: Coordination Agent pops up after another 1s (total 2.5s)
    const t3 = setTimeout(() => {
      setCoordinationVisible(true);
      setGemmaLogs([
        "Identify potential conflicts or coordination between the new task from Secretary Agent and Innovation Lab."
      ]);
    }, 2500);

    // 5. Step 4: Trigger real Gemma 4 reasoning API scan after another 1s (total 3.5s)
    const t4 = setTimeout(async () => {
      setGemmaStage('thinking');
      try {
        const response = await fetch('/api/gemma-coordination-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secretaryTask: {
              domain: 'Career Services',
              agent: 'Secretary Agent',
              target: targetName,
              action: 'Preparing alumni invitation for AI Careers Week.'
            },
            hackathonTask: {
              domain: 'Innovation Lab',
              agent: 'Hackathon Agent',
              target: targetName,
              action: 'Preparing keynote outreach for Business Innovation Hackathon.'
            },
            historicalContext: `${targetName} spoke at an AI Research Center seminar 8 days ago.`
          })
        });

        if (response.ok) {
          const data = await response.json();
          setCoordinationDetails(data);
          
          // Stream logs in sequentially to simulate high fidelity thought processes
          const logsToStream = data.logs || [];
          logsToStream.forEach((logStr: string, idx: number) => {
            setTimeout(() => {
              setGemmaLogs(prev => {
                if (!prev.includes(logStr)) {
                  return [...prev, logStr];
                }
                return prev;
              });
              
              // Phase 1: Issue detected at log index 2
              if (idx === 2) {
                setGemmaStage('analyzed_issues');
              }
              
              // Phase 2: Recommendation triggered after last log
              if (idx === logsToStream.length - 1) {
                setTimeout(() => {
                  setGemmaStage('recommendation');
                }, 1200);
              }
            }, (idx + 1) * 750);
          });
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Server returned status ${response.status}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('Coordination scan failed:', msg);
        setGemmaLogs(prev => [
          ...prev,
          `[ERROR] AI connection failed — ${msg}`,
        ]);
        setGemmaStage('error');
      }
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [setGemmaStage, setGemmaLogs, setGemmaSelectedOption, targetName]);

  // Run automatically when dashboard renders
  useEffect(() => {
    let cleanUpFn: any;
    startWalkthroughSequence().then((cancel) => {
      cleanUpFn = cancel;
    });
    return () => {
      if (cleanUpFn) cleanUpFn();
    };
  }, [startWalkthroughSequence]);
  const handleExecuteGemmaDecision = useCallback(async (
    option: 'both_coordinated' | 'drop_career'
  ) => {
    setGemmaSelectedOption(option);
    setGemmaStage('thinking');

    setGemmaLogs(prev => [
      ...prev,
      '[BlueQ] Recommended approach selected.',
      '[BlueQ] Preparing authorization request...',
    ]);

    try {
      const response = await fetch('/api/request-authorization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedOption:
            option === 'both_coordinated'
              ? 'Ask Alumni Relations to review coordinated outreach'
              : 'Ask Alumni Relations to prioritize one invitation',

          requestingDepartments: [
            'Career Services',
            'Innovation Lab',
          ],

          initiators: [
            {
              name: 'Sarah Lee',
              department: 'Career Services',
              role: 'Program Coordinator',
            },
            {
              name: 'Alex Martinez',
              department: 'Innovation Lab',
              role: 'Program Manager',
            },
          ],

          relationshipOwner: 'Alumni Relations',
          targetPerson: targetName,
        }),
      });

      if (!response.ok) {
        throw new Error('Authorization request failed');
      }

      const data = await response.json();
      setAuthorizationRequest(data);

      setGemmaLogs(prev => [
        ...prev,
        '[BlueQ] Both external drafts remain paused and unsent.',
        '[BlueQ] Internal authorization request sent to Alumni Relations.',
        '[BlueQ] Awaiting response from relationship owner.',
      ]);

      setGemmaStage('resolved');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Authorization request failed:', msg);
      setGemmaLogs(prev => [
        ...prev,
        `[ERROR] Authorization request failed — ${msg}`,
      ]);
      setGemmaStage('error');
    }
  }, [setGemmaSelectedOption, setGemmaStage, setGemmaLogs, setAuthorizationRequest, targetName]);

  // Automatically execute recommended approach when recommendation stage is reached
  useEffect(() => {
    if (gemmaStage === 'recommendation' && coordinationDetails !== null) {
      const autoTimer = setTimeout(() => {
        handleExecuteGemmaDecision('both_coordinated');
      }, 2000);
      return () => clearTimeout(autoTimer);
    }
  }, [gemmaStage, handleExecuteGemmaDecision]);

  return (
    <div className="space-y-6">
      {/* Main Grid: 3 Columns matching the screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Column 1: Left Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">BlueQ Coordination</h3>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Institutional Control
              </p>
            </div>
            
            <nav className="space-y-1.5">
              {domainsList.map((domain) => {
                const DomainIcon = domain.icon;
                const isSelected = selectedDomain === domain.name;
                const isInactive = domain.name === 'AI Research Center' || domain.name === 'Course Domains';
                return (
                  <button
                    key={domain.name}
                    onClick={() => {
                      if (isInactive) return;
                      handleDomainClick(domain.name);
                    }}
                    disabled={isInactive}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${
                      isInactive 
                        ? 'text-slate-400 bg-slate-50 opacity-40 cursor-not-allowed border border-dashed border-slate-200'
                        : isSelected
                          ? 'bg-blue-600 text-white shadow-sm font-bold cursor-pointer'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <DomainIcon className={`h-4 w-4 ${isInactive ? 'text-slate-300 saturate-0' : isSelected ? 'text-white' : domain.color}`} />
                      <span>{domain.name}</span>
                    </div>
                    {isInactive && (
                      <span className="text-[8px] font-mono font-normal uppercase tracking-wider text-slate-400 shrink-0 bg-slate-100 px-1 py-0.5 rounded">
                        Greyed/Idle
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Info Box in Left Column */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider text-[9px]">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              Sovereignty Active
            </div>
            <p>
              Each local classroom and unit operates independently. BlueQ acts passively, broker-listening, only intervening when actions intersect.
            </p>
          </div>
        </div>

        {/* Column 2: Center - Active Domain Lanes with Dotted Connectors */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-5">
            {domainsList.map((domain) => {
              const domainIntents = getDomainIntents(domain.name);
              const DomainIcon = domain.icon;
              const isInactive = domain.name === 'AI Research Center' || domain.name === 'Course Domains';

              return (
                <div 
                  key={domain.name}
                  id={`lane-${domain.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`scroll-mt-20 relative transition-all duration-300 ${
                    selectedDomain === domain.name ? 'ring-1 ring-blue-500/20' : ''
                  } ${isInactive ? 'opacity-40 saturate-50 pointer-events-none' : ''}`}
                >
                  {/* Lane Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${isInactive ? 'bg-slate-100 text-slate-400' : domain.bg} flex items-center justify-center border border-slate-100`}>
                        <DomainIcon className={`h-4 w-4 ${isInactive ? 'text-slate-400' : domain.color}`} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {domain.name} {isInactive && <span className="text-[10px] text-slate-400 font-mono font-normal">(Idle for current demo)</span>}
                      </h4>
                      {domain.name === 'Career Services' && (
                        <span className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          Task List
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lane Cards Row + Connecting Axis */}
                  <div className="relative flex gap-4 items-stretch">
                    {/* Cards Container */}
                    <div className="flex-grow space-y-3">
                      {domain.name === 'Course Domains' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Card 1: Marketing Analytics */}
                          <motion.div
                            layout
                            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                                  MARKETING ANALYTICS AGENT
                                </span>
                                <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                                  ONGOING
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-slate-800 mt-2">
                                Publishing final showcase
                              </h5>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Managing 12 projects in the analytics pipeline.
                              </p>
                            </div>
                            <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                              <span>Source: Canvas LMS</span>
                              <span 
                                onClick={() => triggerHighlight('resource')}
                                className="text-emerald-600 font-bold uppercase cursor-pointer hover:underline"
                              >
                                Handshake
                              </span>
                            </div>
                          </motion.div>

                          {/* Card 2: AI Business Discovery */}
                          <motion.div
                            layout
                            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                                  AI BUSINESS DISCOVERY <RefreshCw className="h-2.5 w-2.5 animate-spin text-slate-400" />
                                </span>
                                <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                                  SEARCHING
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-slate-800 mt-2">
                                Searching for projects
                              </h5>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Scanning current semester for relevant agentic opportunities...
                              </p>
                            </div>
                            <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                              <span>Source: Agent API</span>
                              <span 
                                onClick={() => triggerHighlight('resource')}
                                className="text-emerald-600 font-bold uppercase cursor-pointer hover:underline"
                              >
                                Handshake
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      ) : (
                        // Standard Lanes
                        domainIntents.map((intent) => {
                          // Check visibility based on sequential slide-in walkthrough
                          if (intent.domain === 'Career Services' && !secretaryVisible) {
                            return (
                              <div key="sec-placeholder" className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-6 text-center text-xs text-slate-400 animate-pulse">
                                Secretary Agent initializing...
                              </div>
                            );
                          }
                          if (intent.domain === 'Innovation Lab' && !hackathonVisible) {
                            return (
                              <div key="hack-placeholder" className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-6 text-center text-xs text-slate-400 animate-pulse">
                                Hackathon Agent initializing...
                              </div>
                            );
                          }

                          const isRelationshipHighlighted = activeHighlightGroup === 'relationship' && isIntentInIntersection(intent.id, 'relationship');
                          const isResourceHighlighted = activeHighlightGroup === 'resource' && isIntentInIntersection(intent.id, 'resource');
                          const isHovered = hoveredIntentId === intent.id;
                          const isHighlighted = isRelationshipHighlighted || isResourceHighlighted || isHovered;

                          // Dynamic card borders/styling to highlight relationships
                          let cardBorder = 'border-slate-200 hover:border-slate-300';
                          if (isHighlighted) {
                            cardBorder = 'border-blue-500 ring-2 ring-blue-500/10 shadow-md';
                          } else if (isIntentInIntersection(intent.id, 'relationship')) {
                            cardBorder = 'border-blue-400 border-2 shadow-xs';
                          }

                          let stateBadge = null;
                          if (intent.domain === 'Career Services') {
                            stateBadge = <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">DRAFTING</span>;
                          } else if (intent.domain === 'Innovation Lab') {
                            stateBadge = <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">READY</span>;
                          } else if (intent.domain === 'AI Research Center') {
                            stateBadge = <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">IDLE</span>;
                          }

                          return (
                            <motion.div
                              key={intent.id}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              onMouseEnter={() => setHoveredIntentId(intent.id)}
                              onMouseLeave={() => setHoveredIntentId(null)}
                              onClick={() => triggerHighlight('relationship')}
                              className={`bg-white border rounded-xl p-4 shadow-xs transition-all duration-300 cursor-pointer ${cardBorder}`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                                  {intent.agent.toUpperCase()}
                                </span>
                                {stateBadge}
                              </div>

                              <h5 className="text-sm font-bold text-slate-800 mt-2">
                                {intent.domain === 'Career Services' && 'Preparing alumni invitation'}
                                {intent.domain === 'Innovation Lab' && 'Preparing keynote outreach'}
                                {intent.domain === 'AI Research Center' && 'Following up with speaker'}
                              </h5>

                              <div className="mt-2.5 space-y-1.5 text-xs">
                                {!( (intent.domain === 'Career Services' || intent.domain === 'Innovation Lab') && (gemmaStage === 'awaiting_scan' || gemmaStage === 'thinking') ) && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 w-12 shrink-0">Target:</span>
                                    <span className="text-slate-800 font-bold">
                                      {intent.targetPersonOrResource}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 w-12 shrink-0">Source:</span>
                                  <span className="text-slate-800 font-bold">
                                    {intent.domain === 'Career Services' && 'Alumni Directory + Gmail'}
                                    {intent.domain === 'Innovation Lab' && 'Alumni Directory + Gmail'}
                                    {intent.domain === 'AI Research Center' && 'Calendar + Gmail'}
                                  </span>
                                </div>

                                {/* Staged Real-Time Timeline Analysis */}
                                {(intent.domain === 'Career Services' || intent.domain === 'Innovation Lab') && 
                                 gemmaStage !== 'awaiting_scan' && (gemmaStage !== 'thinking' || coordinationDetails !== null) && (
                                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 font-mono text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <div className="text-[8px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                                      Federated Coordinator Log
                                    </div>
                                    
                                    {/* Step 1: Overlap detected */}
                                    {(gemmaStage === 'analyzed_issues' || gemmaStage === 'recommendation' || gemmaStage === 'resolved' || (gemmaStage === 'thinking' && coordinationDetails !== null)) && (
                                      <div className="flex items-start gap-1.5 text-rose-600 leading-snug">
                                        <span className="font-bold shrink-0">{timestamps.issue}</span>
                                        <span>
                                          <strong>Issue:</strong> {intent.domain === 'Career Services' 
                                            ? `Innovation Lab also wants to contact ${targetName}` 
                                            : `Career Office also wants to contact ${targetName}`}
                                        </span>
                                      </div>
                                    )}

                                    {/* Step 2: Recommendation */}
                                    {(gemmaStage === 'recommendation' || gemmaStage === 'resolved' || (gemmaStage === 'thinking' && coordinationDetails !== null)) && (
                                      <div className="flex items-start gap-1.5 text-blue-600 leading-snug">
                                        <span className="font-bold shrink-0">{timestamps.coordination}</span>
                                        <span>
                                          <strong>Coordination:</strong> Coordination Agent recommends coordinated contact
                                        </span>
                                      </div>
                                    )}

                                    {/* Step 3: Action */}
                                    {gemmaStage === 'resolved' && (
                                      <div className="flex items-start gap-1.5 text-emerald-600 leading-snug">
                                        <span className="font-bold shrink-0">{timestamps.action}</span>
                                        <span>
                                          <strong>Action:</strong> {intent.domain === 'Career Services'
                                            ? 'Send email to Sarah Lee (Director of Career Services) for permission'
                                            : 'Send email to Alex Martinez for permission'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {intent.domain === 'Career Services' && 'sent 3s ago • Running'}
                                    {intent.domain === 'Innovation Lab' && 'sent 1s ago • Running'}
                                    {intent.domain === 'AI Research Center' && 'Last interaction 8 days ago'}
                                  </span>
                                </div>
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHighlight('relationship');
                                  }}
                                  className="text-indigo-600 font-bold uppercase hover:underline"
                                >
                                  Collision
                                </span>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>

                    {/* Dotted Timeline Axis on the Right (Vertical Connected Trunk) */}
                    <div className="w-12 flex flex-col items-center justify-center relative shrink-0 hidden xl:flex">
                      {/* Vertical dotted segment */}
                      <div className="absolute top-0 bottom-0 left-1/2 w-0 border-r-2 border-dashed border-slate-200 -translate-x-1/2" />
                      {/* Node circle */}
                      <div className={`z-10 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm ring-4 transition-all duration-300 ${
                        selectedDomain === domain.name ? 'ring-blue-100 scale-125' : 'ring-slate-100'
                      }`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Footer Description */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4 shadow-2xs">
            <div>
              <span className="font-bold text-slate-700">Coordination Coherence Ledger:</span> No central hierarchy. BlueQ observes structured action intents emitted in the background, only intervening at coordination intersections.
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block animate-ping"></span>
              <span className="font-bold text-slate-600 uppercase">Listening</span>
            </div>
          </div>
        </div>

        {/* Column 3: Right Sidebar - Dynamic Intersection Analysis or Context Guard */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">
            {activeIntersectionId ? (
              // Case A: Selected Intersection Details matching the screenshot
              <motion.div
                key="intersection-analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Intersection Analysis
                  </h3>
                  <button 
                    onClick={() => {
                      setActiveIntersectionId(null);
                      setActiveHighlightGroup(null);
                    }}
                    className="p-1 rounded hover:bg-slate-50 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Entity Panel */}
                {activeIntersectionId === 'intersection-relationship' ? (
                  <>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        UNIFIED ENTITY
                      </span>
                      <h4 className="text-sm font-bold text-[#002f9c]">
                        {targetName}
                      </h4>
                      {targetName === 'Maya Chen' && (
                        <p className="text-[10px] font-mono text-slate-500">
                          ID: ALUM-29931-MC
                        </p>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Provenance Timeline
                      </span>
                      
                      <div className="relative pl-5 space-y-4 border-l border-slate-200 ml-1.5 py-1">
                        {/* Bullet 1 */}
                        <div className="relative">
                          <div className="absolute -left-[23.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border border-white" />
                          <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase">
                            14:02 - CAREER AGENT
                          </span>
                          <p className="text-xs text-slate-700 font-medium mt-0.5">
                            Extracted 'Maya Chen' from Alumni Directory.
                          </p>
                        </div>

                        {/* Bullet 2 */}
                        <div className="relative">
                          <div className="absolute -left-[23.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border border-white" />
                          <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase">
                            14:05 - INNOVATION LAB
                          </span>
                          <p className="text-xs text-slate-700 font-medium mt-0.5">
                            Identified 'Maya Chen' as potential Hackathon judge.
                          </p>
                        </div>

                        {/* Bullet 3 (Active Coordinator) */}
                        <div className="relative">
                          <div className="absolute -left-[23.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border border-white ring-2 ring-blue-100" />
                          <span className="text-[9px] font-mono text-blue-600 block font-bold uppercase">
                            NOW - BLUEQ COORDINATOR
                          </span>
                          <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs font-bold text-blue-800 leading-relaxed mt-1">
                            Intersection Flagged: Merging context logs to prevent redundant communication.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onSelectIntersection('intersection-relationship')}
                      className="w-full text-center py-2.5 bg-[#002f9c] hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer mt-2"
                    >
                      Synchronize Communication
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        UNIFIED RESOURCE
                      </span>
                      <h4 className="text-sm font-bold text-emerald-700">
                        ShelfSense Project
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500">
                        ID: RES-88122-SS
                      </p>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Provenance Timeline
                      </span>
                      
                      <div className="relative pl-5 space-y-4 border-l border-slate-200 ml-1.5 py-1">
                        {/* Bullet 1 */}
                        <div className="relative">
                          <div className="absolute -left-[23.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border border-white" />
                          <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase">
                            11:15 - MARKETING AGENT
                          </span>
                          <p className="text-xs text-slate-700 font-medium mt-0.5">
                            Published 'ShelfSense' student prototype and methodology on Canvas.
                          </p>
                        </div>

                        {/* Bullet 2 */}
                        <div className="relative">
                          <div className="absolute -left-[23.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border border-white" />
                          <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase">
                            11:30 - BUSINESS AGENT
                          </span>
                          <p className="text-xs text-slate-700 font-medium mt-0.5">
                            Requested demo and access under Course Discovery lane.
                          </p>
                        </div>

                        {/* Bullet 3 (Active Coordinator) */}
                        <div className="relative">
                          <div className="absolute -left-[23.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white ring-2 ring-emerald-100" />
                          <span className="text-[9px] font-mono text-emerald-700 block font-bold uppercase">
                            NOW - BLUEQ COORDINATOR
                          </span>
                          <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-800 leading-relaxed mt-1">
                            Handshake Required: Authorization policy check needed for Cross-Course data access.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onSelectIntersection('intersection-resource')}
                      className="w-full text-center py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer mt-2"
                    >
                      Authorize Access
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              // Case B: Default Context Guard and Conflict List matching original App sidebar
              <motion.div
                key="context-guard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {!coordinationVisible ? (
                  <div className="bg-slate-100 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 font-mono space-y-2">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto text-slate-300" />
                    <p>Awaiting local agent activity...</p>
                    <p className="text-[9px] text-slate-300">Emitting intents from mesh channels</p>
                  </div>
                ) : (
                  <>
                    {/* Gemma Coordination Broker Agent Panel */}
                    <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/60 rounded-xl p-5 shadow-lg text-white space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-xl"></div>
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                          <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 font-mono">
                            Central Coordination Agent
                          </h3>
                        </div>
                        <button
                          onClick={startWalkthroughSequence}
                          title="Replay entire sequence"
                          className="p-1 hover:bg-indigo-900/60 rounded border border-indigo-800 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="space-y-3 font-mono text-[11px] leading-relaxed relative z-10">
                        <div className="bg-slate-950/90 border border-indigo-900/50 rounded-lg p-3 max-h-[220px] overflow-y-auto text-[10px] text-emerald-400 space-y-2 scrollbar-thin">
                          {gemmaLogs.map((log, i) => (
                            <div key={i} className="leading-normal border-l border-indigo-900/30 pl-2">
                              <span className="text-cyan-500 mr-1 font-bold">&gt;</span>
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>

                       {gemmaStage === 'thinking' && (
                        <div className="flex items-center justify-center gap-2 text-xs text-cyan-300 py-1.5 font-mono">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Central Coordination Agent reasoning...</span>
                        </div>
                      )}

                      {gemmaStage === 'analyzed_issues' && (
                        <div className="space-y-3 relative z-10">
                          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-xs leading-normal">
                            <span className="text-rose-400 font-bold block mb-1">Collision Detected:</span>
                            <p className="text-[10px] text-slate-300 leading-normal">
                              Identify potential conflicts or coordination between the new task from Secretary Agent and Innovation Lab. Overlapping speaker invitation schedules (October 12) detected.
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>Scanning complete</span>
                            <span className="text-cyan-400 font-bold animate-pulse">Needs Recommendation Decision</span>
                          </div>
                          <button
                            onClick={() => setGemmaStage('recommendation')}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center font-sans"
                          >
                            Generate Recommendations &rarr;
                          </button>
                        </div>
                      )}

                      {gemmaStage === 'recommendation' && (
                        <div className="space-y-3 relative z-10">
                          <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs leading-normal">
                            <span className="text-amber-400 font-bold block mb-1">Collision Analysis:</span>
                            <p className="text-[10px] text-slate-300 leading-normal">
                              {coordinationDetails?.conflictAnalysis || "Identify potential conflicts or coordination between the new task from Secretary Agent and Innovation Lab. Suggesting Broker Merge to preserve sovereignty."}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <button
                              onClick={() => handleExecuteGemmaDecision('both_coordinated')}
                              className="w-full text-left p-2.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/40 hover:border-indigo-600 rounded-lg transition-all text-xs cursor-pointer"
                            >
                              <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                                <span>{coordinationDetails?.solution1?.title || "Option 1: Coordinated Dual Outreach"}</span>
                                <span className="text-[7px] bg-cyan-900/55 text-cyan-300 px-1.5 py-0.2 rounded uppercase font-bold tracking-wider">Recommended</span>
                              </div>
                              <p className="text-[10px] text-slate-300 leading-normal mt-1">
                                {coordinationDetails?.solution1?.description || "Align both requests in a single unified outreach email from Alumni Relations."}
                              </p>
                            </button>

                            <button
                              onClick={() => handleExecuteGemmaDecision('drop_career')}
                              className="w-full text-left p-2.5 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800 hover:border-slate-700 rounded-lg transition-all text-xs opacity-60 cursor-pointer"
                            >
                              <div className="font-bold text-slate-300">
                                {coordinationDetails?.solution2?.title || "Option 2: Drop Career Services Outreach"}
                              </div>
                              <p className="text-[10px] text-slate-400 leading-normal mt-1">
                                {coordinationDetails?.solution2?.description || "Let Career Services stand down to prioritize the Innovation Lab keynote keynote invitation."}
                              </p>
                            </button>
                          </div>
                        </div>
                      )}

                      {gemmaStage === 'resolved' && (
                        <div className="space-y-3 relative z-10">
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-xs leading-relaxed">
                            <span className="font-bold block text-white mb-1">
                              ✓ Authorization Request Sent
                            </span>

                            <p className="text-emerald-200 text-[10px]">
                              Both external outreach drafts remain paused and unsent.
                            </p>

                            <p className="text-slate-300 mt-1 text-[10px]">
                              Awaiting response from{' '}
                              <strong>{authorizationRequest?.awaitingResponseFrom || 'Alumni Relations'}</strong>.
                            </p>
                          </div>

                          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-[10px] space-y-2 font-mono">
                            <div>
                              <span className="text-slate-500">To:</span>{' '}
                              <span className="text-white">{authorizationRequest?.to || 'Alumni Relations'}</span>
                            </div>

                            <div>
                              <span className="text-slate-500">CC:</span>{' '}
                              <span className="text-white">
                                {authorizationRequest?.cc ? authorizationRequest.cc.join(', ') : 'Sarah Lee (Career Services), Alex Martinez (Innovation Lab)'}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-500">Subject:</span>{' '}
                              <span className="text-cyan-400">
                                {authorizationRequest?.subject || `Review requested: overlapping outreach to ${targetName}`}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              onSelectIntersection('intersection-relationship')
                            }
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center font-sans"
                          >
                            View Authorization Request
                          </button>
                        </div>
                      )}

                      {gemmaStage === 'resolved' && lumaEventUrl && (
                        <div className="mt-3 p-3 bg-slate-950/60 border border-cyan-900/40 rounded-lg space-y-2.5 relative z-10">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                            <Link2 className="h-3.5 w-3.5" />
                            Routing Through Luma
                          </div>

                          <div className="space-y-1.5 font-mono text-[10px] text-slate-300">
                            {lumaLogs.map((log, i) => (
                              <div key={i} className="leading-normal border-l border-cyan-900/30 pl-2">
                                <span className="text-cyan-500 mr-1 font-bold">&gt;</span>
                                {log}
                              </div>
                            ))}
                          </div>

                          {(lumaStage === 'browsing') && (
                            <div className="flex items-center gap-2 text-[10px] text-cyan-300">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Real ActionLayer browser task in progress&mdash;can take a few minutes, especially during busy periods.</span>
                            </div>
                          )}

                          {lumaStage === 'confirmed' && foundHostName && (
                            <div className="flex items-center gap-2 text-[10px] text-emerald-300 pt-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Confirmed target: <strong>{foundHostName}</strong></span>
                            </div>
                          )}

                          {lumaStage === 'error' && (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-start gap-2 text-[10px] text-red-300">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{lumaError}</span>
                              </div>
                              <button
                                onClick={() => runLumaRoutingSequence()}
                                className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center font-sans"
                              >
                                Retry
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                      {gemmaStage === 'error' && (
                        <div className="space-y-3 relative z-10">
                          <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-xs leading-normal">
                            <span className="text-red-400 font-bold block mb-1">⚠ AI Connection Error</span>
                            <p className="text-[10px] text-slate-300 leading-normal">
                              Could not reach the Novita AI service. Check that <code className="bg-slate-800 px-1 rounded">NOVITA_API_KEY</code> and <code className="bg-slate-800 px-1 rounded">NOVITA_MODEL</code> in <code className="bg-slate-800 px-1 rounded">.env.local</code> are valid and restart the server.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setGemmaStage('awaiting_scan');
                              setGemmaLogs([]);
                            }}
                            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center font-sans"
                          >
                            Retry
                          </button>
                        </div>
                      )}

                    {/* AI Explainability Table */}
                    {gemmaStage !== 'awaiting_scan' && gemmaStage !== 'thinking' && gemmaStage !== 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="font-bold text-slate-800 uppercase tracking-wider font-mono text-[10px] flex items-center gap-1.5">
                            <Cpu className="h-3.5 w-3.5 text-indigo-600" /> AI Explainability Table
                          </div>
                          <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase font-mono">
                            Audit Ready
                          </span>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] leading-relaxed">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-mono text-[9px] uppercase">
                                <th className="py-1 font-bold">Metric / Vector</th>
                                <th className="py-1 font-bold pl-2">System Explanation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                              <tr>
                                <td className="py-2 font-bold text-slate-800">Collision Target</td>
                                <td className="py-2 pl-2 text-rose-600 font-mono font-bold">
                                  {targetName}{targetName === 'Maya Chen' ? ' (ALUM-29931-MC)' : ''}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 font-bold text-slate-800">Temporal Closeness</td>
                                <td className="py-2 pl-2">Overlap within same week (October 12) &amp; seminar 8d ago</td>
                              </tr>
                              <tr>
                                <td className="py-2 font-bold text-slate-800">Recommended Policy</td>
                                <td className="py-2 pl-2 text-indigo-600 font-semibold">Coordinated Contact (Broker Merge)</td>
                              </tr>
                              <tr>
                                <td className="py-2 font-bold text-slate-800">Sovereignty Status</td>
                                <td className="py-2 pl-2 text-emerald-600 font-bold">Respected (Requires Permission)</td>
                              </tr>
                              <tr>
                                <td className="py-2 font-bold text-slate-800">Broker Confidence</td>
                                <td className="py-2 pl-2 font-mono text-cyan-600 font-bold">98.4% (Central Coordination Agent Real-time)</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
