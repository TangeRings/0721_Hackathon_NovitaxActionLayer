/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActionIntent, Intersection, Handshake } from '../types';
import { 
  Users, 
  FileLock, 
  ArrowRight, 
  Lock, 
  Unlock, 
  Eye, 
  UserCheck, 
  Clock, 
  Mail, 
  Check, 
  AlertCircle, 
  FileText, 
  Loader2, 
  ShieldCheck, 
  HelpCircle,
  Copy,
  ChevronRight
} from 'lucide-react';

interface IntersectionsViewProps {
  intents: ActionIntent[];
  intersections: Intersection[];
  onAddHandshake: (handshake: Handshake) => void;
  onUpdateIntersectionStatus: (id: string, status: Intersection['status'], details: any) => void;
  gemmaStage: 'awaiting_scan' | 'thinking' | 'analyzed_issues' | 'recommendation' | 'resolved' | 'error';
  setGemmaStage: (stage: 'awaiting_scan' | 'thinking' | 'analyzed_issues' | 'recommendation' | 'resolved' | 'error') => void;
  gemmaLogs: string[];
  setGemmaLogs: React.Dispatch<React.SetStateAction<string[]>>;
  gemmaSelectedOption: 'both_coordinated' | 'drop_career' | null;
  setGemmaSelectedOption: (option: 'both_coordinated' | 'drop_career' | null) => void;
  /** Coordination target identity; defaults to the demo's "Maya Chen" scenario but can be
   * overridden by a real host discovered via the Luma + ActionLayer lookup. */
  targetName?: string;
}

export const IntersectionsView: React.FC<IntersectionsViewProps> = ({
  intents,
  intersections,
  onAddHandshake,
  onUpdateIntersectionStatus,
  gemmaStage,
  setGemmaStage,
  gemmaLogs,
  setGemmaLogs,
  gemmaSelectedOption,
  setGemmaSelectedOption,
  targetName = 'Guest',
}) => {
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string>('intersection-relationship');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  
  // Loading states for backend Novita AI calls
  const [loadingConsolidation, setLoadingConsolidation] = useState(false);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [consolidationError, setConsolidationError] = useState<string | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  
  // State for relationship collision resolution selection
  const [relationshipChoice, setRelationshipChoice] = useState<string | null>(null);
  const [consolidatedDraft, setConsolidatedDraft] = useState<any | null>(null);

  // States for cross-course authorization checkbox selections
  const [grantViewOnly, setGrantViewOnly] = useState(true);
  const [grant72h, setGrant72h] = useState(true);
  const [grantNoDownload, setGrantNoDownload] = useState(true);
  const [grantNoRawData, setGrantNoRawData] = useState(true);
  const [grantNoContact, setGrantNoContact] = useState(true);
  const [policyEvaluation, setPolicyEvaluation] = useState<any | null>(null);
  const [handshakeAuthorized, setHandshakeAuthorized] = useState(false);

  const selectedIntersection = intersections.find(item => item.id === selectedIntersectionId);

  // Synchronize Gemma simulation resolved state with Intersections view
  useEffect(() => {
    if (gemmaStage === 'resolved' && !consolidatedDraft) {
      const loadGemmaDraft = async () => {
        setLoadingConsolidation(true);
        setRelationshipChoice('consolidate');
        try {
          const response = await fetch('/api/consolidate-outreach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetName }),
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Server error ${response.status}`);
          }
          const data = await response.json();
          setConsolidatedDraft(data);
          onUpdateIntersectionStatus('intersection-relationship', 'resolved_consolidated', {
            choice: 'Consolidate outreach under Alumni Relations',
            timestamp: new Date().toLocaleTimeString(),
            resultSummary: 'Unified Gmail communication generated and sent to drafts.',
            generatedContent: 'Joint Invitation from Stanford University: Fall AI Panel & Hackathon Keynote',
            provenanceTrail: [
              "[Central Coordination Agent] Intercepted overlapping intents from Career Services and Innovation Lab.",
              `[Central Coordination Agent] Verified that ${targetName} spoke at AI Research Center 8 days ago.`,
              "[Central Coordination Agent] Compiled single professional invitation from Alumni Relations Office.",
              "[Central Coordination Agent] Dispatched coordinated notification to both department heads."
            ]
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          console.error('Consolidation failed:', msg);
          setConsolidationError(msg);
        } finally {
          setLoadingConsolidation(false);
        }
      };
      loadGemmaDraft();
    }
  }, [gemmaStage]);

  // Auto-fetch policy on view load
  useEffect(() => {
    if (selectedIntersectionId === 'intersection-resource' && !policyEvaluation) {
      handleEvaluatePolicy();
    }
  }, [selectedIntersectionId]);

  // Consolidate outreach API call
  const handleConsolidateOutreach = async () => {
    setLoadingConsolidation(true);
    setConsolidationError(null);
    setRelationshipChoice('consolidate');
    try {
      const response = await fetch('/api/consolidate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${response.status}`);
      }
      const data = await response.json();
      setConsolidatedDraft(data);

      onUpdateIntersectionStatus('intersection-relationship', 'resolved_consolidated', {
        choice: 'Consolidate outreach under Alumni Relations',
        timestamp: new Date().toLocaleTimeString(),
        resultSummary: 'Unified Gmail communication generated and sent to drafts.',
        generatedContent: data.body,
        provenanceTrail: data.provenanceTrail
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Consolidation failed:', msg);
      setConsolidationError(msg);
      setRelationshipChoice(null);
    } finally {
      setLoadingConsolidation(false);
    }
  };

  // Push consolidated outreach as a completed handshake to ledger
  const handlePushConsolidatedToLedger = () => {
    if (!consolidatedDraft) return;
    
    const newHandshake: Handshake = {
      id: `handshake-consolidated-${Date.now()}`,
      requestingDomain: 'Career Services & Innovation Lab',
      resourceOrRelationshipOwner: 'Alumni Relations',
      declaredPurpose: 'Keynote hackathon outreach + panel invitation coordination',
      requestedScope: 'Coordinated single-sender Gmail communication',
      governingPolicy: 'Institutional Relationship Owner Governance Policy Sec 2',
      approvedBy: 'Alumni Relations Coordinator (Human verified)',
      finalAction: `Gmail Draft Generated: "${consolidatedDraft.subject}"`,
      expiration: 'None',
      revocationStatus: 'active',
      provenanceTrail: consolidatedDraft.provenanceTrail || [
        'Career Services and Innovation Lab duplicate intents detected.',
        'BlueQ intercepted outreach, routed authorization to Alumni Relations.',
        'Brokered single consolidated outreach draft.'
      ]
    };

    onAddHandshake(newHandshake);
    setShowSuccessBanner(true);
    setTimeout(() => {
      setShowSuccessBanner(false);
    }, 6000);
  };

  // Prioritize hackathon option selected
  const handlePrioritizeHackathon = () => {
    setRelationshipChoice('prioritize');
    onUpdateIntersectionStatus('intersection-relationship', 'resolved_prioritized', {
      choice: 'Prioritize Hackathon Keynote Outreach',
      timestamp: new Date().toLocaleTimeString(),
      resultSummary: 'Prioritized Hackathon Outreach; Career Services speaker request deferred.',
      provenanceTrail: [
        'Conflict identified between Career Services panel and Innovation Lab keynote.',
        'Decision: Prioritized keynote due to speaker alignment policy.',
        'Career Services Agent notified of deferral; requested to identify alternative AI panel speaker.'
      ]
    });
  };

  // Ask relationship owner selected
  const handleAskOwner = () => {
    setRelationshipChoice('ask_owner');
    onUpdateIntersectionStatus('intersection-relationship', 'resolved_external', {
      choice: 'Defer to Relationship Owner',
      timestamp: new Date().toLocaleTimeString(),
      resultSummary: 'Referred request to Alumni Relations Director for manual guidance.',
      provenanceTrail: [
        'Conflict identified between multiple departments.',
        'Deffered decision to manual authority.',
        'Slack alert dispatched to Alumni Relations Director for approval.'
      ]
    });
  };

  // Reset relationship state to allow switching
  const handleResetRelationship = () => {
    setRelationshipChoice(null);
    setConsolidatedDraft(null);
    onUpdateIntersectionStatus('intersection-relationship', 'open', null);
  };

  // Evaluate policy with Novita AI
  const handleEvaluatePolicy = async () => {
    setLoadingPolicy(true);
    setPolicyError(null);
    try {
      const response = await fetch('/api/evaluate-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${response.status}`);
      }
      const data = await response.json();
      setPolicyEvaluation(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Policy evaluation failed:', msg);
      setPolicyError(msg);
    } finally {
      setLoadingPolicy(false);
    }
  };

  // Approve scoped access handshake
  const handleApproveAccessHandshake = () => {
    if (!policyEvaluation) return;
    setHandshakeAuthorized(true);

    const resultingScope = [
      grantViewOnly ? 'View-Only' : 'Full access',
      grant72h ? '72-Hour Expiration' : 'Permanent',
      grantNoDownload ? 'No Download' : 'Download allowed',
      grantNoRawData ? 'No Raw Data (Anonymized)' : 'Raw transcripts included',
      grantNoContact ? 'No Personal Disclosures' : 'Contact sharing permitted'
    ].join(', ');

    // Add this resolved handshake to ledger
    const newHandshake: Handshake = {
      id: `handshake-shelf-sense-${Date.now()}`,
      requestingDomain: 'AI for Business Student Discovery Agent',
      resourceOrRelationshipOwner: 'Marketing Analytics Project Agent',
      declaredPurpose: 'Course research and inspiration regarding ShelfSense',
      requestedScope: `Scoped Grant: [${resultingScope}]`,
      governingPolicy: 'Cross-Course Collaboration Framework - Section 5.1 (Mixed Permissions)',
      approvedBy: 'Marketing Analytics Project Team (Via Handshake Approval Panel)',
      finalAction: 'Secure 72-hour ephemeral access token generated for requester',
      expiration: grant72h ? '72 Hours (Expires ' + new Date(Date.now() + 72*3600*1000).toLocaleString() + ')' : 'None',
      revocationStatus: 'active',
      provenanceTrail: policyEvaluation.provenanceTrail || [
        'AI for Business Agent requested access to ShelfSense.',
        'BlueQ detected unpublished prototype and triggered dual-party handshake.',
        'Project team authorized view-only ephemeral grant on constraints.',
        'Ledger locked scoped grant token.'
      ]
    };

    onAddHandshake(newHandshake);
    onUpdateIntersectionStatus('intersection-resource', 'resolved_handshake_approved', {
      choice: 'Approved Scoped Access Handshake',
      timestamp: new Date().toLocaleTimeString(),
      resultSummary: '72-hour secure view-only grant finalized.',
      scopedAccess: {
        viewOnly: grantViewOnly,
        duration72h: grant72h,
        noDownload: grantNoDownload,
        noRawData: grantNoRawData,
        noContactDisclosure: grantNoContact
      },
      provenanceTrail: newHandshake.provenanceTrail
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Sidebar - Intersection List */}
      <div className="lg:col-span-4 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Active Intersections
        </h3>
        <div className="space-y-3">
          {intersections.map((item) => {
            const isSelected = item.id === selectedIntersectionId;
            const isResolved = item.status !== 'open';
            
            const borderClass = isSelected 
              ? 'bg-white border-2 border-indigo-600 shadow-sm ring-1 ring-indigo-600/5' 
              : isResolved 
                ? 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs'
                : 'bg-white border border-amber-200 border-l-4 border-l-amber-400 shadow-xs hover:border-slate-300 hover:shadow-sm';

            return (
              <button
                key={item.id}
                onClick={() => setSelectedIntersectionId(item.id)}
                className={`w-full text-left p-4 rounded-xl cursor-pointer flex items-start gap-3.5 transition-all ${borderClass}`}
              >
                <div className={`mt-0.5 p-1.5 rounded-lg ${
                  item.type === 'relationship_collision' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {item.type === 'relationship_collision' ? <Users className="h-4 w-4" /> : <FileLock className="h-4 w-4" />}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-semibold text-[10px] text-slate-400 uppercase tracking-wider">
                      {item.type === 'relationship_collision' ? 'Relationship' : 'Authorization'}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                      isResolved ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isResolved ? 'RESOLVED' : 'CONFLICTING'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mt-1 truncate">
                    {item.type === 'relationship_collision' ? targetName : 'ShelfSense Project'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          {selectedIntersection && (
            <motion.div
              key={selectedIntersection.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs"
            >
              {/* Header */}
              <div className="border-b border-slate-200 pb-4 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                      selectedIntersection.type === 'relationship_collision' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {selectedIntersection.type === 'relationship_collision' ? 'Semantic Relationship Guard' : 'Federated Policy Guard'}
                    </span>
                    {selectedIntersection.status !== 'open' && (
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <Check className="h-3 w-3" /> Resolved
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-bold text-slate-900 text-lg mt-1.5">
                    {selectedIntersection.title}
                  </h2>
                </div>
                <div className="text-[10px] text-slate-400 font-mono text-right">
                  ID: {selectedIntersection.id}
                </div>
              </div>

              {/* INTERSECTION 1: RELATIONSHIP COLLISION VIEW */}
              {selectedIntersection.type === 'relationship_collision' && (
                <div className="space-y-6">
                  {/* Explanation Block */}
                  <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl border-l-4 border-l-amber-400 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-display font-semibold text-xs text-amber-800">
                        Incoherent Institutional Relationship Detected
                      </h4>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        “Each action is independently valid. Together, they create an incoherent institutional relationship.”
                      </p>
                      <ul className="text-xs text-amber-700/95 mt-2 space-y-1.5 list-disc list-inside bg-white/60 p-2.5 rounded border border-amber-100/40">
                        <li><strong>Career Services Agent</strong> proposing outreach for AI Careers Week.</li>
                        <li><strong>Innovation Lab Agent</strong> preparing keynote outreach for Business Innovation Hackathon.</li>
                        <li><strong>AI Research Center</strong> confirms she spoke on campus <strong>eight days ago</strong>.</li>
                        <li><strong>Alumni Relations</strong> remains the designated relationship owner.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Resolution Selection */}
                  {selectedIntersection.status === 'open' ? (
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-xs text-slate-400 uppercase tracking-wider">
                        Select Institutional Brokerage Resolution
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Option 1: Consolidate outreach */}
                        <button
                          onClick={handleConsolidateOutreach}
                          disabled={loadingConsolidation}
                          className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all flex flex-col items-start gap-2 cursor-pointer relative group shadow-2xs"
                        >
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100">
                            {loadingConsolidation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          </div>
                          <span className="font-bold text-xs text-slate-900 mt-1">
                            Consolidate Outreach
                          </span>
                          <span className="text-[11px] text-slate-500 leading-snug flex-grow">
                            Create one coordinated Gmail draft from Alumni Relations combining both requests.
                          </span>
                          <div className="mt-3 text-[10px] font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 pt-1 border-t border-slate-100 w-full">
                            Execute Resolution <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>

                        {/* Option 2: Prioritize Hackathon */}
                        <button
                          onClick={handlePrioritizeHackathon}
                          className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all flex flex-col items-start gap-2 cursor-pointer group shadow-2xs"
                        >
                          <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-slate-100">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-xs text-slate-900 mt-1">
                            Prioritize Hackathon
                          </span>
                          <span className="text-[11px] text-slate-500 leading-snug flex-grow">
                            Decline Career Services and prioritize the Innovation Lab keynote outreach.
                          </span>
                          <div className="mt-3 text-[10px] font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 pt-1 border-t border-slate-100 w-full">
                            Execute Resolution <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>

                        {/* Option 3: Ask relationship owner */}
                        <button
                          onClick={handleAskOwner}
                          className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all flex flex-col items-start gap-2 cursor-pointer group shadow-2xs"
                        >
                          <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-slate-100">
                            <HelpCircle className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-xs text-slate-900 mt-1">
                            Ask Alumni Director
                          </span>
                          <span className="text-[11px] text-slate-500 leading-snug flex-grow">
                            Hold actions and query the Alumni Relations Director directly on Slack.
                          </span>
                          <div className="mt-3 text-[10px] font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 pt-1 border-t border-slate-100 w-full">
                            Query Director <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* RESOLVED STATE FOR RELATIONSHIP */
                    <div className="space-y-6">
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Brokerage Result: {selectedIntersection.resolutionDetails?.choice}
                          </span>
                          <button
                            onClick={handleResetRelationship}
                            className="text-[10px] font-mono text-slate-500 hover:text-slate-900 underline cursor-pointer"
                          >
                            Reset Resolution
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {selectedIntersection.resolutionDetails?.resultSummary}
                        </p>
                      </div>

                      {relationshipChoice === 'consolidate' && (
                        <div className="space-y-4">
                          <AnimatePresence>
                            {showSuccessBanner && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2 font-medium shadow-sm"
                              >
                                <span className="p-1 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                                <div>
                                  <span className="font-bold block">✓ Handshake Published</span>
                                  <span>Brokered Outreach Handshake has been securely appended to the Handshakes &amp; Audit Ledger.</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center justify-between">
                            <h3 className="font-display font-semibold text-xs text-slate-500 uppercase flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-blue-500" /> Coordinated Gmail Draft (Novita AI Brokered)
                            </h3>
                            {consolidatedDraft && (
                              <button
                                onClick={handlePushConsolidatedToLedger}
                                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Publish Handshake to Audit
                              </button>
                            )}
                          </div>

                          {loadingConsolidation ? (
                            <div className="border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center space-y-3">
                              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                              <span className="text-xs text-slate-500 font-mono">
                                Novita AI compiling semantic context & drafting outreach...
                              </span>
                            </div>
                          ) : consolidationError ? (
                            <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3">
                              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-red-700">AI Connection Error</p>
                                <p className="text-[11px] text-red-600 mt-0.5">{consolidationError}</p>
                                <button
                                  onClick={() => { setConsolidationError(null); handleConsolidateOutreach(); }}
                                  className="mt-2 text-[11px] text-red-700 underline hover:no-underline cursor-pointer"
                                >
                                  Retry
                                </button>
                              </div>
                            </div>
                          ) : (
                            consolidatedDraft && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white text-xs"
                              >
                                {/* Header Info */}
                                <div className="bg-slate-50 border-b border-slate-150 p-3 space-y-1.5 font-mono text-[11px] text-slate-600">
                                  <div>
                                    <strong className="text-slate-900">Sender:</strong> {consolidatedDraft.sender}
                                  </div>
                                  <div>
                                    <strong className="text-slate-900">To:</strong> {consolidatedDraft.recipient}
                                  </div>
                                  <div>
                                    <strong className="text-slate-900">Collaborators:</strong> {consolidatedDraft.collaborators?.join(', ')}
                                  </div>
                                  <div>
                                    <strong className="text-slate-900">Subject:</strong> {consolidatedDraft.subject}
                                  </div>
                                </div>
                                {/* Body */}
                                <div className="p-4 whitespace-pre-line text-slate-800 leading-relaxed font-sans bg-white select-text">
                                  {consolidatedDraft.body}
                                </div>
                                {/* Provenance Trail */}
                                <div className="bg-slate-50/50 border-t border-slate-100 p-3">
                                  <h5 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Decision Provenance Trail
                                  </h5>
                                  <ul className="space-y-1.5 font-mono text-[10px] text-slate-500">
                                    {consolidatedDraft.provenanceTrail?.map((trail: string, idx: number) => (
                                      <li key={idx} className="flex items-start gap-1.5">
                                        <ChevronRight className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                                        <span>{trail}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </motion.div>
                            )
                          )}
                        </div>
                      )}

                      {(relationshipChoice === 'prioritize' || relationshipChoice === 'ask_owner') && (
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <h4 className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                            Provenance Audit trail
                          </h4>
                          <ul className="space-y-2 text-[11px] font-mono text-slate-500">
                            {selectedIntersection.resolutionDetails?.provenanceTrail?.map((trail: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                <span>{trail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* INTERSECTION 2: CROSS-COURSE RESOURCE AUTHORIZATION VIEW */}
              {selectedIntersection.type === 'cross_course_authorization' && (
                <div className="space-y-6">
                  {/* Two-Sided Authorization Handshake Header */}
                  <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 border border-slate-100 bg-slate-50/40 p-4 rounded-xl">
                    {/* Requester */}
                    <div className="md:col-span-5 text-center md:text-left p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[9px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                        Requester Agent
                      </span>
                      <h4 className="font-display font-semibold text-slate-800 text-xs mt-1 leading-snug">
                        AI for Business Student Discovery Agent
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Domain: Course Domains
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="md:col-span-1 text-center flex justify-center text-slate-400">
                      <ArrowRight className="h-4 w-4 hidden md:block" />
                      <span className="md:hidden text-xs text-slate-400">requests</span>
                    </div>

                    {/* Owner */}
                    <div className="md:col-span-5 text-center md:text-left p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[9px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
                        Resource Owner Agent
                      </span>
                      <h4 className="font-display font-semibold text-slate-800 text-xs mt-1 leading-snug">
                        Marketing Analytics Project Agent
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Resource: ShelfSense Project
                      </p>
                    </div>
                  </div>

                  {/* Metadata requested */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Automatic availability list */}
                    <div className="border border-slate-150 rounded-xl p-4 space-y-2.5">
                      <h4 className="font-display font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                        Available Automatically
                      </h4>
                      <div className="space-y-1.5">
                        {['Project Title', 'Abstract', 'Topic Tags', 'Research Methodology Summary', 'Demo Video'].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-emerald-50/20 px-2 py-1 border border-emerald-50/50 rounded">
                            <Unlock className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Handshake/Private List */}
                    <div className="border border-slate-150 rounded-xl p-4 space-y-2.5">
                      <h4 className="font-display font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
                        Handshake Required / Private
                      </h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-amber-50/20 px-2 py-1 border border-amber-50/50 rounded">
                          <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                          <span>Unpublished Prototype (Needs Team Grant)</span>
                        </div>
                        {['Raw Interview Transcripts', 'Source Files', 'Student Personal Data'].map((item) => (
                          <div key={item} className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-slate-100 px-2 py-1 border border-slate-200 rounded opacity-60">
                            <Lock className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="line-through">{item} (Strictly Private)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Policy Decision Evaluation Block from server */}
                  {loadingPolicy ? (
                    <div className="border border-slate-200 rounded-xl p-6 flex items-center justify-center gap-3">
                      <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
                      <span className="text-xs text-slate-500 font-mono">
                        Evaluating canvas authorization policies via Novita AI...
                      </span>
                    </div>
                  ) : policyError ? (
                    <div className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-700">AI Connection Error</p>
                        <p className="text-[11px] text-red-600 mt-0.5">{policyError}</p>
                        <button
                          onClick={() => { setPolicyError(null); handleEvaluatePolicy(); }}
                          className="mt-2 text-[11px] text-red-700 underline hover:no-underline cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : (
                    policyEvaluation && (
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3">
                        <h4 className="font-display font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Broker Policy Decision (Novita AI Policy Resolver)
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {policyEvaluation.policyExplanation}
                        </p>
                      </div>
                    )
                  )}

                  {/* Authorization panel for project team */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                    <h4 className="font-display font-semibold text-xs text-slate-800 uppercase tracking-wider font-mono">
                      Marketing Analytics Project Team: Handshake Authorization
                    </h4>
                    <p className="text-xs text-slate-500">
                      Define the custom scoped access bounds you wish to delegate. AI for Business Discovery Agent cannot request anything beyond these bounds.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      {[
                        { label: 'View-Only Access', val: grantViewOnly, set: setGrantViewOnly },
                        { label: '72-Hour Ephemeral Expiration', val: grant72h, set: setGrant72h },
                        { label: 'Disable Asset Download', val: grantNoDownload, set: setGrantNoDownload },
                        { label: 'Restrict Raw Interview Transcripts', val: grantNoRawData, set: setGrantNoRawData },
                        { label: 'Anonymize personal and contact details', val: grantNoContact, set: setGrantNoContact },
                      ].map((item, idx) => (
                        <label key={idx} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={item.val} 
                            onChange={(e) => item.set(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleApproveAccessHandshake}
                        disabled={handshakeAuthorized}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 ${
                          handshakeAuthorized 
                            ? 'bg-slate-100 text-slate-400' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <UserCheck className="h-4 w-4" />
                        {handshakeAuthorized ? 'Scoped Handshake Authorized' : 'Grant Scoped Access Handshake'}
                      </button>
                    </div>

                    {handshakeAuthorized && (
                      <motion.div 
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 space-y-1"
                      >
                        <div className="font-semibold flex items-center gap-1">
                          <Check className="h-4 w-4" /> Scoped Access Grant Signed & Locked on Ledger
                        </div>
                        <p className="text-[11px] text-emerald-700 font-mono mt-1">
                          Grant bounds: [View-Only: {grantViewOnly?'Yes':'No'}, Expire-72h: {grant72h?'Yes':'No'}, Block-Download: {grantNoDownload?'Yes':'No'}, Block-Raw: {grantNoRawData?'Yes':'No'}, Anonymized: {grantNoContact?'Yes':'No'}].
                        </p>
                        <p className="text-[11px] text-emerald-600 font-mono">
                          Handshake token has been dispatched to AI for Business Discovery Agent. Published to Audit.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
