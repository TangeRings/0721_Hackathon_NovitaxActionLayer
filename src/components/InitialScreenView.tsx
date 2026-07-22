/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  Plus, 
  ArrowRight, 
  User, 
  Layers, 
  Check, 
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { GoogleSheetsIcon, GoogleFormsIcon, GmailIcon } from './GoogleIcons';

interface InitialScreenViewProps {
  onContinue: () => void;
}

export const InitialScreenView: React.FC<InitialScreenViewProps> = ({ onContinue }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [typedTextLeft, setTypedTextLeft] = useState('');
  const [typedTextRight, setTypedTextRight] = useState('');

  const leftFullText = "Find a strong alumni speaker for AI Careers Week. Prioritize someone senior in AI partnerships and prepare an invitation.";
  const rightFullText = "Review keynote nominations for the Business Innovation Hackathon and prepare outreach to the strongest AI ecosystem speaker.";

  // Auto-typing animation effect
  useEffect(() => {
    let leftIndex = 0;
    let rightIndex = 0;
    setTypedTextLeft('');
    setTypedTextRight('');

    const leftTimer = setInterval(() => {
      if (leftIndex < leftFullText.length) {
        setTypedTextLeft((prev) => prev + leftFullText.charAt(leftIndex));
        leftIndex++;
      } else {
        clearInterval(leftTimer);
      }
    }, 15);

    const rightTimer = setInterval(() => {
      if (rightIndex < rightFullText.length) {
        setTypedTextRight((prev) => prev + rightFullText.charAt(rightIndex));
        rightIndex++;
      } else {
        clearInterval(rightTimer);
      }
    }, 15);

    return () => {
      clearInterval(leftTimer);
      clearInterval(rightTimer);
    };
  }, [step]); // Re-run typing if step resets, to make it dynamic and fun!

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans flex flex-col justify-between selection:bg-indigo-100">
      
      {/* Minimal Header */}
      <header className="px-8 py-4 flex items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              BlueQ Coordination Layer for Agentic Institutions
            </h1>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-6 py-6 flex-1 flex flex-col justify-center gap-6">
        
        {/* Modern SaaS Headline Block */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 1, height: 'auto', marginBottom: 4 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl leading-tight">
                When teams in different departments use their own local AI agents, they run into coordination conflicts.
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Split Screen Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* LEFT WORKSPACE CARD: Career Services */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`bg-white border rounded-2xl p-8 shadow-xs flex flex-col justify-between transition-all duration-300 relative ${
              step === 2 ? 'ring-2 ring-indigo-600/10 border-indigo-200' : 'border-slate-200/80'
            }`}
          >
            {/* Top Section Label */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
                Career Services
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                Local Agent 1
              </span>
            </div>

            {/* User Info Row */}
            <div className="flex items-center gap-4 mb-6">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80" 
                alt="Sarah Lee" 
                className="w-12 h-12 rounded-full border border-slate-100 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Sarah Lee</h3>
                <p className="text-xs text-slate-400 font-medium">Program Coordinator</p>
              </div>
            </div>

            {/* Large Rounded Text Box for Prompt */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 min-h-24 mb-6 relative">
              <span className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider border border-slate-100 rounded">
                Agent Intent
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                {typedTextLeft}
                <span className="animate-pulse font-extrabold text-indigo-600">|</span>
              </p>
            </div>

            {/* Sources & Expansion Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer">
                  <Plus className="h-3.5 w-3.5 text-slate-400" />
                  Add source
                </span>
                <span className="text-[10px] text-slate-300 font-mono">2 Sources Connected</span>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  // Step 1: Collapsed compact chips
                  <motion.div 
                    key="step-1-left-sources"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
                  >
                    <div className="bg-slate-50/50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl p-3 flex items-center gap-3 transition-all duration-200 min-w-0">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-3xs shrink-0">
                        <GoogleSheetsIcon className="h-5.5 w-5.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Google Sheets</p>
                        <p className="text-xs font-bold text-slate-700 truncate">AI Careers Week — Alumni Candidates</p>
                      </div>
                    </div>
                    <div className="bg-slate-50/50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl p-3 flex items-center gap-3 transition-all duration-200 min-w-0">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-3xs shrink-0">
                        <GmailIcon className="h-5.5 w-5.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Gmail Inbox</p>
                        <p className="text-xs font-bold text-slate-700 truncate">Gmail connected</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // Step 2: Expanded Source Preview Table
                  <motion.div 
                    key="step-2-left-sources"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-200/60 pb-2">
                        <GoogleSheetsIcon className="h-5 w-5 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700">
                          AI Careers Week — Alumni Candidates (Google Sheet)
                        </span>
                      </div>
                      
                      {/* Grid Table Preview */}
                      <div className="space-y-1.5 text-[11px]">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                          <div className="col-span-4">Candidate</div>
                          <div className="col-span-3">Affiliation</div>
                          <div className="col-span-3">Role</div>
                          <div className="col-span-2 text-right">Score</div>
                        </div>
                        {/* Row 1 (Highlight!) */}
                        <div className="grid grid-cols-12 gap-1 py-1.5 border-b border-rose-100 items-center font-medium rounded px-1 border-l-2 border-l-rose-500 relative overflow-visible animate-flash-red">
                          <div className="col-span-4 text-slate-900 font-bold flex items-center gap-1">
                            Last Mile Hackathon Host <span className="relative flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span></span>
                          </div>
                          <div className="col-span-3 text-slate-600">Novita AI</div>
                          <div className="col-span-3 text-slate-600 truncate">Event Organizer</div>
                          <div className="col-span-2 text-right font-bold text-emerald-600">Excellent</div>
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-12 gap-1 py-1.5 border-b border-slate-100 items-center text-slate-500">
                          <div className="col-span-4 font-bold text-slate-700">Daniel Wu</div>
                          <div className="col-span-3">OpenAI</div>
                          <div className="col-span-3 truncate">Head of AI Products</div>
                          <div className="col-span-2 text-right font-bold">Strong</div>
                        </div>
                        {/* Row 3 */}
                        <div className="grid grid-cols-12 gap-1 py-1 items-center text-slate-500">
                          <div className="col-span-4 font-bold text-slate-700">Priya Shah</div>
                          <div className="col-span-3">Anthropic</div>
                          <div className="col-span-3 truncate">AI Strategy Lead</div>
                          <div className="col-span-2 text-right font-bold">Strong</div>
                        </div>
                      </div>
                    </div>

                    {/* Gmail connected chip inline */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <GmailIcon className="h-3.5 w-3.5 shrink-0" />
                      Gmail delivery pipeline initialized for candidate list.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* RIGHT WORKSPACE CARD: Innovation Lab */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className={`bg-white border rounded-2xl p-8 shadow-xs flex flex-col justify-between transition-all duration-300 relative ${
              step === 2 ? 'ring-2 ring-indigo-600/10 border-indigo-200' : 'border-slate-200/80'
            }`}
          >
            {/* Top Section Label */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
                Innovation Lab
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                Local Agent 2
              </span>
            </div>

            {/* User Info Row */}
            <div className="flex items-center gap-4 mb-6">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80" 
                alt="Alex Martinez" 
                className="w-12 h-12 rounded-full border border-slate-100 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Alex Martinez</h3>
                <p className="text-xs text-slate-400 font-medium">Program Manager</p>
              </div>
            </div>

            {/* Large Rounded Text Box for Prompt */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 min-h-24 mb-6 relative">
              <span className="absolute -top-2 left-4 px-2 bg-white text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider border border-slate-100 rounded">
                Agent Intent
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
                {typedTextRight}
                <span className="animate-pulse font-extrabold text-indigo-600">|</span>
              </p>
            </div>

            {/* Sources & Expansion Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 hover:text-slate-800 transition-colors cursor-pointer">
                  <Plus className="h-3.5 w-3.5 text-slate-400" />
                  Add source
                </span>
                <span className="text-[10px] text-slate-300 font-mono">2 Sources Connected</span>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  // Step 1: Collapsed compact chips
                  <motion.div 
                    key="step-1-right-sources"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
                  >
                    <div className="bg-slate-50/50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl p-3 flex items-center gap-3 transition-all duration-200 min-w-0">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-3xs shrink-0">
                        <GoogleFormsIcon className="h-5.5 w-5.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Google Forms</p>
                        <p className="text-xs font-bold text-slate-700 truncate">Hackathon Keynote Nominations</p>
                      </div>
                    </div>
                    <div className="bg-slate-50/50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl p-3 flex items-center gap-3 transition-all duration-200 min-w-0">
                      <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-3xs shrink-0">
                        <GmailIcon className="h-5.5 w-5.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Gmail Inbox</p>
                        <p className="text-xs font-bold text-slate-700 truncate">Gmail connected</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // Step 2: Expanded Source Preview Table
                  <motion.div 
                    key="step-2-right-sources"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3 border-b border-slate-200/60 pb-2">
                        <GoogleFormsIcon className="h-5 w-5 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700">
                          Hackathon Keynote Nominations (Google Form Responses)
                        </span>
                      </div>
                      
                      {/* Grid Table Preview */}
                      <div className="space-y-1.5 text-[11px]">
                        {/* Header Row */}
                        <div className="grid grid-cols-12 gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                          <div className="col-span-4">Nominee</div>
                          <div className="col-span-4">Organization</div>
                          <div className="col-span-4 text-right">Self-Confirmed</div>
                        </div>
                        {/* Row 1 (Highlight!) */}
                        <div className="grid grid-cols-12 gap-1 py-1.5 border-b border-rose-100 items-center font-medium rounded px-1 border-l-2 border-l-rose-500 relative overflow-visible animate-flash-red">
                          <div className="col-span-4 text-slate-900 font-bold flex items-center gap-1">
                            Last Mile Hackathon Host <span className="relative flex h-2 w-2 ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span></span>
                          </div>
                          <div className="col-span-4 text-slate-600">Novita AI</div>
                          <div className="col-span-4 text-right font-bold text-indigo-600">Yes</div>
                        </div>
                        {/* Row 2 */}
                        <div className="grid grid-cols-12 gap-1 py-1.5 border-b border-slate-100 items-center text-slate-500">
                          <div className="col-span-4 font-bold text-slate-700">Jordan Kim</div>
                          <div className="col-span-4">Microsoft</div>
                          <div className="col-span-4 text-right font-bold">Yes</div>
                        </div>
                        {/* Row 3 */}
                        <div className="grid grid-cols-12 gap-1 py-1 items-center text-slate-500">
                          <div className="col-span-4 font-bold text-slate-700">Lena Ortiz</div>
                          <div className="col-span-4">NVIDIA</div>
                          <div className="col-span-4 text-right font-bold text-rose-500">No</div>
                        </div>
                      </div>
                    </div>

                    {/* Gmail connected chip inline */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <GmailIcon className="h-3.5 w-3.5 shrink-0" />
                      Gmail delivery pipeline ready to execute keynote outreach.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>

        {/* BOTTOM AREA: Explanatory Banner & Navigation */}
        <div className="space-y-6">
          <motion.div 
            layout
            className="p-6 bg-indigo-50 border border-indigo-150 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl mt-0.5 shadow-xs">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-h-[40px] flex items-center">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step-1-banner-text"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="space-y-1"
                    >
                      <p className="text-base font-semibold text-indigo-950 leading-relaxed">
                        Two people working with their local agents at Stanford University are about to reach out to the same speaker.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step-2-banner-text"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="space-y-1"
                    >
                      <p className="text-base font-bold text-indigo-950 flex flex-wrap items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        Possible speaker conflict detected:{" "}
                        <span className="underline font-black decoration-amber-500 text-indigo-600 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200">
                          Last Mile Hackathon Host
                        </span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Transition Controls inside the banner for slick demo presentation */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end shrink-0">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.button
                    key="step-1-btn"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] shrink-0 animate-flash-blue-btn"
                  >
                    See Details
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    key="step-2-btn"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={onContinue}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] shrink-0 animate-flash-blue-btn"
                  >
                    See How BlueQ resolves conflicts
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          
          <div className="text-center">
            <p className="text-[11px] text-slate-400 font-mono">
              BlueQ Neutral Coordination Ledger &bull; Federated Campus Coordination
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};
