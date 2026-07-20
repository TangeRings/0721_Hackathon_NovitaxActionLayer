/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  initialActionIntents, 
  initialIntersections, 
  initialHandshakes, 
  initialCourseRecognitions 
} from './data';
import { ActionIntent, Intersection, Handshake, CourseRecognition } from './types';
import { LiveCoordinationView } from './components/LiveCoordinationView';
import { IntersectionsView } from './components/IntersectionsView';
import { AuditView } from './components/AuditView';
import { InitialScreenView } from './components/InitialScreenView';
import { 
  Calendar, 
  Database, 
  Mail, 
  Cpu,
  Info,
  ChevronRight,
  FileText,
  Activity,
  RotateCcw
} from 'lucide-react';

export default function App() {
  // Screen/View Routing: 'initial' or 'dashboard'
  const [currentView, setCurrentView] = useState<'initial' | 'dashboard'>('initial');

  // Navigation Tabs for Dashboard
  const [activeTab, setActiveTab] = useState<'mesh' | 'intersections' | 'audit'>('mesh');

  // Gemma Coordinator Simulation State
  // 'awaiting_scan' | 'thinking' | 'analyzed_issues' | 'recommendation' | 'resolved'
  const [gemmaStage, setGemmaStage] = useState<'awaiting_scan' | 'thinking' | 'analyzed_issues' | 'recommendation' | 'resolved'>('awaiting_scan');
  const [gemmaLogs, setGemmaLogs] = useState<string[]>([]);
  const [gemmaSelectedOption, setGemmaSelectedOption] = useState<'both_coordinated' | 'drop_career' | null>(null);

  // Core Applet State
  const [intents, setIntents] = useState<ActionIntent[]>(initialActionIntents);
  const [intersections, setIntersections] = useState<Intersection[]>(initialIntersections);
  const [handshakes, setHandshakes] = useState<Handshake[]>(initialHandshakes);
  const [courseRecognitions, setCourseRecognitions] = useState<CourseRecognition[]>(initialCourseRecognitions);

  // Switch to intersection view and focus on a specific conflict
  const handleFocusIntersection = (id: string) => {
    setActiveTab('intersections');
  };

  // Callback to add a new handshake from child components
  const handleAddHandshake = (newHandshake: Handshake) => {
    setHandshakes((prev) => [newHandshake, ...prev]);
  };

  // Callback to update an intersection's resolution status
  const handleUpdateIntersectionStatus = (
    id: string, 
    status: Intersection['status'], 
    resolutionDetails: any
  ) => {
    setIntersections((prev) => 
      prev.map((item) => 
        item.id === id 
          ? { ...item, status, resolutionDetails } 
          : item
      )
    );
  };

  // Add a newly published course recognition event
  const handlePublishLecture = (newRecognition: CourseRecognition) => {
    setCourseRecognitions((prev) => [newRecognition, ...prev]);
  };

  // Revoke a handshake
  const handleRevokeHandshake = (id: string) => {
    setHandshakes((prev) => 
      prev.map((h) => 
        h.id === id 
          ? { ...h, revocationStatus: 'revoked', finalAction: 'Access Token Revoked (Immediate expiration)' } 
          : h
      )
    );
  };

  if (currentView === 'initial') {
    return <InitialScreenView onContinue={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 flex flex-col">
      {/* Main Header exactly matching the layout of the screenshot */}
      <header className="border-b border-slate-200 bg-white shrink-0 z-40 sticky top-0 px-6 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Title and Subtitle block */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-blue-900 tracking-tight">
              BlueQ Coordination Layer for Agentic Institutions
            </h1>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="flex gap-6 self-center">
          {[
            { id: 'mesh', label: 'Live Coordination' },
            { id: 'intersections', label: 'Intersections' },
            { id: 'audit', label: 'Handshakes & Audit' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs font-bold pb-2 pt-2 transition-all cursor-pointer border-b-2 tracking-wide uppercase ${
                  isActive 
                    ? 'border-blue-600 text-blue-900 font-extrabold' 
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action/Status Area */}
        <div className="flex items-center gap-5 justify-end shrink-0">
          <div className="flex items-center gap-3.5">
            {/* Mail Icon with green dot */}
            <div className="relative p-1 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-slate-700">
              <Mail className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full ring-2 ring-white"></span>
            </div>
            {/* Calendar Icon with green dot */}
            <div className="relative p-1 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-slate-700">
              <Calendar className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full ring-2 ring-white"></span>
            </div>
            {/* Video/Drive Icon with green dot */}
            <div className="relative p-1 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-slate-700">
              <Database className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full ring-2 ring-white"></span>
            </div>
            {/* Sheets Icon with green dot */}
            <div className="relative p-1 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors text-slate-400 hover:text-slate-700">
              <FileText className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full ring-2 ring-white"></span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>

          {/* User profile avatar headshot */}
          <div className="flex items-center gap-2">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80" 
              alt="Profile" 
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full border border-slate-200 object-cover shadow-2xs"
            />
          </div>
        </div>
      </header>

      {/* Subheader Philosophy Banner */}
      <div className="bg-slate-100 border-b border-slate-200 py-2 px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2 font-mono">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>Sovereign Domains Active: 4 Lanes &bull; BlueQ listens passively.</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-blue-600">
          <span>Flows: {intents.length} &bull; Security Level: Maximum Coherence</span>
          <button 
            onClick={() => setCurrentView('initial')}
            className="flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded transition-all cursor-pointer text-[9px]"
          >
            <RotateCcw className="h-3 w-3 text-slate-400" />
            Reset Demo Walkthrough
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        <div className="w-full">
          {activeTab === 'mesh' && (
            <LiveCoordinationView 
              intents={intents} 
              intersections={intersections}
              onSelectIntersection={handleFocusIntersection}
              gemmaStage={gemmaStage}
              setGemmaStage={setGemmaStage}
              gemmaLogs={gemmaLogs}
              setGemmaLogs={setGemmaLogs}
              gemmaSelectedOption={gemmaSelectedOption}
              setGemmaSelectedOption={setGemmaSelectedOption}
            />
          )}

          {activeTab === 'intersections' && (
            <IntersectionsView
              intents={intents}
              intersections={intersections}
              onAddHandshake={handleAddHandshake}
              onUpdateIntersectionStatus={handleUpdateIntersectionStatus}
              gemmaStage={gemmaStage}
              setGemmaStage={setGemmaStage}
              gemmaLogs={gemmaLogs}
              setGemmaLogs={setGemmaLogs}
              gemmaSelectedOption={gemmaSelectedOption}
              setGemmaSelectedOption={setGemmaSelectedOption}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView
              handshakes={handshakes}
              courseRecognitions={courseRecognitions}
              onRevokeHandshake={handleRevokeHandshake}
              onPublishLecture={handlePublishLecture}
            />
          )}
        </div>
      </main>

      {/* System Footer */}
      <footer className="h-10 bg-slate-900 text-slate-400 px-8 flex items-center justify-between text-[10px] shrink-0 font-mono mt-auto">
        <div className="flex gap-6">
          <span><span className="text-slate-200">Active Flows:</span> {intents.length + 128}</span>
          <span><span className="text-slate-200">Sovereignty Status:</span> Intact</span>
        </div>
        <div className="flex gap-4">
          <span className="text-blue-400 font-bold">Institutional Activity Coordination: Synchronized</span>
          <span className="opacity-50">|</span>
          <span>GMT {new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      </footer>
    </div>
  );
}
