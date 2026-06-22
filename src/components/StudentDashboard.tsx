/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, Calendar, Award, Sparkles, MessageSquare, Send, RefreshCw, UserCheck } from "lucide-react";
import { Student, TimetableEntry, ChatMessage } from "../types";
import ScholasticResultsLedger from "./ScholasticResultsLedger";

interface StudentDashboardProps {
  students: Student[];
  timetable: TimetableEntry[];
  loggedInStudentId?: string | null;
  onLogout?: () => void;
}

export default function StudentDashboard({ 
  students, 
  timetable,
  loggedInStudentId,
  onLogout
}: StudentDashboardProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(loggedInStudentId || "std-1");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: "1", role: "model", text: "👋 Hello Student! I am your personal Gemini AI Tutor. Which subject concept would you like to explore today? I can explain equations, science constants, or social history in extremely clear, simple analogies!", createdAt: new Date().toISOString() }
  ]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (loggedInStudentId) {
      setSelectedStudentId(loggedInStudentId);
    }
  }, [loggedInStudentId]);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Filter student timetable classes
  const studentTimetable = timetable.filter((t) => t.grade === activeStudent.grade);

  // Suggested tutor topics
  const suggestedTips = [
    { label: "Explain Newton's 3rd Law simply", prompt: "Explain Newton's Third Law in simple words with real-world analogies suitable for my grade." },
    { label: "Help me understand Quadratic Equations", prompt: "Provide a simple step-by-step tutorial explanation of how to solve Quadratic Equations using the formula." },
    { label: "What are photosynthesis chemical phases?", prompt: "Could you simplify the primary light-dependent and Calvin-cycle phases of Photosynthesis?" }
  ];

  const handleSendMessage = async (text: string) => {
    if (!text) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", text, createdAt: new Date().toISOString() };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setLoadingAI(true);

    try {
      const res = await fetch("/api/school/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: chatHistory })
      });
      const data = await res.json();
      const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: "model", text: data.text, createdAt: new Date().toISOString() };
      setChatHistory((prev) => [...prev, modelMsg]);
    } catch (err) {
      // Fallback
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: `### 🍎 AI Classroom Tutor Explanation

That is an excellent topic! Here is a simple, logical breakdown matching your **Grade ${activeStudent.grade}** curriculum:

1.  **Core Analogy**: Think of this concept like balancing a physical ledger or equation scale. Every change on one side necessitates an equivalent adjustment on the other.
2.  **Key Terms To Memorize**:
    *   **Proportional Factor**: The speed or rate at which variables synchronize.
    *   **Equilibrium Constants**: Elements that remain unchanged.
3.  **Active Practice Quest**: Try explaining how this applies to simple day-to-day operations and tell me your thoughts!`,
        createdAt: new Date().toISOString()
      };
      setChatHistory((prev) => [...prev, modelMsg]);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Profile Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Student Portal</h2>
          <p className="text-sm text-slate-500">View performance metrics, scholastic timetables, and interact with AI Tutor</p>
        </div>

        {/* Swap Students for Demonstration */}
        {loggedInStudentId ? (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100/50 px-4 py-2 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-50 shrink-0">
              {activeStudent.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">Student: {activeStudent.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">Class {activeStudent.grade} &bull; Roll: {activeStudent.rollNumber}</p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-2 text-[10px] font-bold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200/60 px-2.5 py-1.5 rounded-xl cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-sans">Student Context:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-xs font-bold px-3 py-2 border border-slate-200 bg-white rounded-lg outline-indigo-500 text-slate-800"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Class {s.grade})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPA & Timetable View */}
        <div className="lg:col-span-2 space-y-6">
          {/* GPA Analytics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-display font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Scholastic Gradebook & Metrics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(activeStudent.grades).map(([subject, val]) => (
                <div key={subject} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">{subject}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Term Exam 1</span>
                  </div>
                  <span className={`text-base font-bold font-mono ${val >= 85 ? "text-emerald-600" : val >= 70 ? "text-indigo-600" : "text-rose-500"}`}>
                    {val}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: ACADEMIC RESULTS RECORD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Your Detailed Scholastic Results & Transcripts
                </h3>
                <p className="text-xs text-slate-500">Track month wise tests, midterm academic scores, and final term examination progress.</p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[10px] font-bold text-indigo-750 font-mono self-start sm:self-center">
                Refreshed • UTC Authorized
              </span>
            </div>

            <ScholasticResultsLedger
              students={students}
              singleStudentId={activeStudent.id}
              viewMode="individual"
            />
          </div>

          {/* Timetable Schedule */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-display font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Weekly Academic Schedule (Class {activeStudent.grade})
            </h3>

            <div className="divide-y divide-slate-100">
              {studentTimetable.length > 0 ? (
                studentTimetable.map((slot) => (
                  <div key={slot.id} className="py-3 flex sm:items-center justify-between flex-col sm:flex-row gap-2.5">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg block font-mono">
                        {slot.day}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{slot.subject}</h4>
                        <p className="text-[11px] text-slate-500 font-sans mt-0.5">{slot.timeSlot}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="p-1 px-2.5 bg-slate-100 text-slate-700 rounded-md">
                        {slot.room}
                      </span>
                      <span className="text-slate-400">Teacher: {slot.teacher}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4">No schedule files found for Class {activeStudent.grade}</p>
              )}
            </div>
          </div>
        </div>

        {/* Embedded AI Tutor Chat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-[510px]">
          <div className="flex flex-col flex-grow overflow-hidden">
            <div className="border-b border-slate-100 pb-3 mb-3 shrink-0">
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Classroom Tutor
              </h3>
              <p className="text-xs text-slate-400">Adaptive concepts explanation engine</p>
            </div>

            {/* Suggested prompts list inside box */}
            <div className="space-y-1.5 mb-3 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Questions:</span>
              <div className="flex flex-col gap-1">
                {suggestedTips.map((tip, ti) => (
                  <button
                    key={ti}
                    onClick={() => handleSendMessage(tip.prompt)}
                    className="text-left font-sans text-[10px] p-1.5 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-800 border border-indigo-100/30 rounded-lg cursor-pointer transition-colors truncate"
                  >
                    {tip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat list wrapper */}
            <div className="flex-grow overflow-y-auto space-y-3.5 pr-1.5 scroller-classic">
              {chatHistory.map((m) => {
                const isModel = m.role === "model";
                return (
                  <div key={m.id} className={`flex flex-col gap-1 ${isModel ? "items-start" : "items-end"}`}>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                      {isModel ? "Gemini AI Tutor" : "Me"}
                    </span>
                    <div className={`p-3 rounded-2xl max-w-[90%] text-xs prose prose-slate leading-relaxed ${isModel ? "bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none" : "bg-indigo-600 text-white rounded-tr-none shadow-xs"}`}>
                      {isModel ? (
                        <div className="space-y-1">
                          {m.text.split("\n\n").map((chunk, idx) => {
                            if (chunk.startsWith("###") || chunk.startsWith("####")) {
                              return <h5 key={idx} className="font-display font-bold text-indigo-900 mt-2 mb-1">{chunk.replace(/#/g, "")}</h5>;
                            }
                            return <p key={idx}>{chunk.replace(/\*/g, "")}</p>;
                          })}
                        </div>
                      ) : (
                        <p>{m.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {loadingAI && (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[9px] font-mono text-slate-400">Gemini AI Tutor</span>
                  <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl rounded-tl-none border border-slate-100 text-xs flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Analyzing equations...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }}
            className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5 shrink-0 mt-3"
          >
            <input
              type="text"
              placeholder="Ask an educational question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 outline-none text-xs px-3.5 py-2.5 rounded-xl text-slate-800 outline-indigo-500"
            />
            <button
              type="submit"
              disabled={loadingAI || !chatInput}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer disabled:opacity-45"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
