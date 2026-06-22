/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, MessageSquare, X, Send, RefreshCw } from "lucide-react";

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "💬 Hello! I am the SmartEdu AI School Assistant. I am here 24/7 to answer questions about school regulations, solve mathematics homework, or help navigate schedules. How can I assist you today?" }
  ]);
  const [generating, setGenerating] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput) return;
    const userText = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: userText }]);
    setGenerating(true);

    try {
      const res = await fetch("/api/gemini/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: chatHistory })
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (err) {
      // Fallback
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          text: `### 🎓 SmartEdu Information Desk

I am currently running in offline simulation mode. Here is standard guidelines information corresponding to school pathways:
*   **Curriculum Regulations**: Grades are updated inside the system weekly. Exam schedules map directly to term benchmarks.
*   **Absentee Counseling**: Students with attendance below 85% trigger standard guidance workflows.
*   **Fees Regulations**: Remittances clear within 24 hours inside the principal ledger.`
        }
      ]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Bubble Button */}
      {!isOpen && (
        <button
          id="btn-chatbot-fab"
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:scale-105 transition-all outline-none cursor-pointer"
          title="Open AI School Assistant"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Expandable Chat Widget */}
      {isOpen && (
        <div className="w-[340px] h-[450px] bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="font-display font-bold text-xs">AI School Assistant</h4>
                <p className="text-[9px] text-slate-400 font-mono">Powered by Gemini 3.5 Flash</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat log */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 scroller-classic">
            {chatHistory.map((m, idx) => {
              const isModel = m.role === "model";
              return (
                <div key={idx} className={`flex flex-col gap-0.5 ${isModel ? "items-start" : "items-end"}`}>
                  <span className="text-[8px] font-mono text-slate-400 uppercase">
                    {isModel ? "SmartEdu Assistant" : "Me"}
                  </span>
                  <div className={`p-2.5 rounded-xl text-xs max-w-[90%] leading-relaxed ${isModel ? "bg-white text-slate-800 border border-slate-100 rounded-tl-none font-sans" : "bg-indigo-600 text-white rounded-tr-none"}`}>
                    {isModel ? (
                      <div className="space-y-1">
                        {m.text.split("\n\n").map((chunk, ci) => {
                          if (chunk.startsWith("###")) {
                            return <h5 key={ci} className="font-display font-semibold text-slate-950 mt-1 border-b border-slate-100 pb-0.5">{chunk.replace("###", "")}</h5>;
                          }
                          return <p key={ci}>{chunk.replace(/\*/g, "")}</p>;
                        })}
                      </div>
                    ) : (
                      <p>{m.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {generating && (
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[8px] font-mono text-slate-400 uppercase">SmartEdu Assistant</span>
                <div className="p-2.5 bg-white text-slate-600 rounded-xl rounded-tl-none border border-slate-100 text-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-1.5 shrink-0 bg-white">
            <input
              type="text"
              required
              placeholder="Ask about school procedures, syllabus..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none outline-indigo-500 text-slate-800"
            />
            <button
              type="submit"
              disabled={generating || !chatInput}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-45"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
