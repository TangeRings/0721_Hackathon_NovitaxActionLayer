/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Handshake, CourseRecognition } from '../types';
import { 
  History, 
  Trash2, 
  ShieldCheck, 
  BookOpen, 
  GraduationCap, 
  Send, 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertTriangle,
  AlertCircle,
  Award,
  Loader2,
  ChevronRight,
  BookMarked
} from 'lucide-react';

interface AuditViewProps {
  handshakes: Handshake[];
  courseRecognitions: CourseRecognition[];
  onRevokeHandshake: (id: string) => void;
  onPublishLecture: (recognition: CourseRecognition) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({
  handshakes,
  courseRecognitions,
  onRevokeHandshake,
  onPublishLecture,
}) => {
  const [customLectureTitle, setCustomLectureTitle] = useState('Public Lecture: AI Governance & Ethics');
  const [publishingLecture, setPublishingLecture] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [activeCourseAudit, setActiveCourseAudit] = useState<CourseRecognition | null>(null);

  // Publish a new lecture event and translate its meaning via Gemini API
  const handlePublishLecture = async () => {
    if (!customLectureTitle.trim()) return;
    setPublishingLecture(true);
    setPublishError(null);
    try {
      const response = await fetch('/api/translate-meaning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureTitle: customLectureTitle }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${response.status}`);
      }
      const data = await response.json();
      
      const newRecognition: CourseRecognition = {
        id: `recognition-${Date.now()}`,
        eventName: data.event || customLectureTitle,
        publishingDomain: 'AI Research Center',
        courses: data.translation.map((t: any) => ({
          courseName: t.course,
          agentName: t.agentName,
          rule: t.rule,
          outcome: t.outcome
        }))
      };

      onPublishLecture(newRecognition);
      setActiveCourseAudit(newRecognition);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Lecture publish failed:', msg);
      setPublishError(msg);
    } finally {
      setPublishingLecture(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Visual Header Callout */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-start gap-3 shadow-xs">
        <History className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600">
          <h4 className="font-display font-semibold text-slate-900">
            Handshake Brokerage & Provenance Ledger
          </h4>
          <p className="mt-0.5 leading-relaxed">
            All cross-domain authorization grants, consolidated outreach vectors, and participation records are cryptographically crypt-signed and logged. Sovereign domains retain ultimate control; policies can be revoked in real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Handshakes Ledger */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Active & Historic Handshakes ({handshakes.length})
          </h3>

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {handshakes.map((handshake) => {
                const isRevoked = handshake.revocationStatus === 'revoked';
                
                return (
                  <motion.div
                    key={handshake.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`border rounded-xl p-5 bg-white shadow-xs relative transition-all ${
                      isRevoked ? 'border-red-200 bg-red-50/5 opacity-80' : 'border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        isRevoked 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isRevoked ? 'REVOKED' : 'ACTIVE'}
                      </span>
                      {!isRevoked && (
                        <button
                          onClick={() => onRevokeHandshake(handshake.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                          title="Revoke and cancel access policy"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Metadata Header */}
                    <div className="flex flex-col md:flex-row md:items-center gap-x-3 gap-y-1 text-xs">
                      <span className="font-mono text-slate-400">Broker ID: {handshake.id.slice(0, 15)}</span>
                      <span className="hidden md:inline text-slate-300">|</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        Requester: <strong className="text-slate-900">{handshake.requestingDomain}</strong>
                      </span>
                      <span className="hidden md:inline text-slate-300">→</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        Owner: <strong className="text-slate-900">{handshake.resourceOrRelationshipOwner}</strong>
                      </span>
                    </div>

                    {/* Core Handshake Body */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Declared Purpose</span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{handshake.declaredPurpose}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Requested Scope</span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed font-mono">{handshake.requestedScope}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-150 grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] font-mono text-slate-500">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] block mb-0.5">Governing Policy:</span>
                        <p className="text-slate-700 font-medium">{handshake.governingPolicy}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] block mb-0.5">Approved Authority:</span>
                        <p className="text-slate-700 font-medium">{handshake.approvedBy}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] block mb-0.5">Final Action / Expiration:</span>
                        <p className="text-slate-700 font-medium truncate" title={handshake.finalAction}>
                          {handshake.finalAction} <span className="text-slate-400">({handshake.expiration})</span>
                        </p>
                      </div>
                    </div>

                    {/* Provenance Trail details accordion */}
                    <div className="mt-4 pt-3 border-t border-slate-150 bg-slate-50/50 -mx-5 -mb-5 p-4 rounded-b-xl">
                      <h5 className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Provenance Audit Trail
                      </h5>
                      <ul className="space-y-1">
                        {handshake.provenanceTrail.map((trail, index) => (
                          <li key={index} className="text-[10px] text-slate-500 font-mono flex items-start gap-1">
                            <ChevronRight className="h-3 w-3 text-slate-300 mt-0.5 shrink-0" />
                            <span>{trail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Course Recognition Simulator */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-indigo-600" />
              Course Recognition
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Sovereignty Principle:</strong> BlueQ must not assign grades or create course policy. It only sends a verified institutional participation record to teacher-controlled course domains.
            </p>

            {/* Simulated Event Creator */}
            <div className="space-y-2.5 pt-3 border-t border-slate-200">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                Publish Approved Public Lecture
              </label>
              <input
                type="text"
                value={customLectureTitle}
                onChange={(e) => setCustomLectureTitle(e.target.value)}
                placeholder="e.g., Seminar on AI Governance"
                className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
              />
              <button
                onClick={handlePublishLecture}
                disabled={publishingLecture}
                className="w-full text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {publishingLecture ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Publishing & Translating...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Publish Approved Lecture
                  </>
                )}
              </button>
            </div>

            {publishError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">AI Connection Error</p>
                  <p className="text-red-600 mt-0.5">{publishError}</p>
                </div>
              </div>
            )}

            {/* Output Verification Display */}
            {activeCourseAudit && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3 pt-4 border-t border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    Verification Records Dispatched
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <strong className="text-slate-800 font-bold block">
                    {activeCourseAudit.eventName}
                  </strong>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Source: {activeCourseAudit.publishingDomain} (Sealed)
                  </span>
                </div>

                <div className="space-y-2">
                  {activeCourseAudit.courses.map((course, idx) => (
                    <div 
                      key={idx}
                      className="border border-slate-200 rounded-lg p-3.5 bg-white hover:shadow-2xs transition-shadow space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display font-semibold text-xs text-slate-900">
                          {course.courseName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {course.agentName}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600 leading-snug">
                        <div>
                          <span className="font-mono text-[9px] text-slate-400 uppercase block">Course rule</span>
                          <span className="text-slate-800 font-medium">{course.rule}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[9px] text-slate-400 uppercase block">Resulting outcome</span>
                          <span className={`inline-flex px-1.5 py-0.5 rounded-sm text-[11px] font-medium mt-0.5 ${
                            course.outcome === 'No action' 
                              ? 'bg-slate-100 text-slate-600' 
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {course.outcome}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Historical course actions logs */}
          {courseRecognitions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 font-mono">
                Recent Recognitions History
              </h4>
              <div className="space-y-2">
                {courseRecognitions.map((recognition) => (
                  <div key={recognition.id} className="p-3.5 border border-slate-200 bg-white rounded-xl text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                      <strong className="text-slate-800 font-medium truncate max-w-[200px]" title={recognition.eventName}>
                        {recognition.eventName}
                      </strong>
                      <span className="text-[9px] font-mono text-slate-400">
                        LEDGER LOCK
                      </span>
                    </div>
                    <div className="space-y-1.5 font-mono text-[10px] text-slate-500">
                      {recognition.courses.map((course, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-1">
                          <span>{course.courseName}:</span>
                          <span className="text-slate-800 font-medium text-right">{course.outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
