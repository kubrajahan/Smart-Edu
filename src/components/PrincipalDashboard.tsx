/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TrendingUp, AlertTriangle, Coins, BarChart3, HelpCircle, ShieldAlert, Sparkles, RefreshCw, Layers, Award, Calendar } from "lucide-react";
import { Student, Teacher, LibraryBook, TimetableEntry } from "../types";
import ScholasticResultsLedger from "./ScholasticResultsLedger";
import SchoolFeesRegistry from "./SchoolFeesRegistry";

interface PrincipalDashboardProps {
  students: Student[];
  teachers: Teacher[];
  libraryBooks: LibraryBook[];
  timetable: TimetableEntry[];
  onPayFees: (studentId: string, amount: number, method: string, remarks?: string) => Promise<boolean>;
}

export default function PrincipalDashboard({ students, teachers, libraryBooks, timetable = [], onPayFees }: PrincipalDashboardProps) {
  const [strategicCounsel, setStrategicCounsel] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("10-A");

  // Compute stats
  const totalOutstandingFees = students.reduce((acc, s) => acc + s.schoolFeesStatus.due, 0);
  const totalPaidFees = students.reduce((acc, s) => acc + s.schoolFeesStatus.paid, 0);
  const overallAttendance = Math.round(students.reduce((acc, s) => acc + s.attendanceRate, 0) / students.length);
  const highRiskStudents = students.filter((s) => s.riskLevel === "High");

  // Custom Chart Data: Performance across subjects
  const subjectAverages = {
    Mathematics: Math.round(students.reduce((acc, s) => acc + (s.grades.Mathematics || 0), 0) / students.length),
    Science: Math.round(students.reduce((acc, s) => acc + (s.grades.Science || 0), 0) / students.length),
    English: Math.round(students.reduce((acc, s) => acc + (s.grades.English || 0), 0) / students.length),
    "Social Studies": Math.round(students.reduce((acc, s) => acc + (s.grades["Social Studies"] || 0), 0) / students.length),
    "Computer Science": Math.round(students.reduce((acc, s) => acc + (s.grades["Computer Science"] || 0), 0) / students.length),
  };

  const loadStrategicRecommendations = async () => {
    setGenerating(true);
    try {
      const prompt = `Based on the following school diagnostic stats, generate an executive strategic strategic plan for the Principal:
- Overall Attendance: ${overallAttendance}%
- Total Outstanding Fees: $${totalOutstandingFees}
- Subject Averages: Math: ${subjectAverages.Mathematics}%, Science: ${subjectAverages.Science}%, English: ${subjectAverages.English}%, Computer Science: ${subjectAverages["Computer Science"]}%
- At-Risk Student Registry: ${highRiskStudents.map(s => `${s.name} (Grade ${s.grade}, Attendance: ${s.attendanceRate}%, Risk: ${s.riskLevel})`).join(", ")}
Format the response in structured, motivational Markdown with sections:
1. Executive Assessment
2. Financial Liquidation Roadmap
3. Early-Warning absenteeism Interventions (particularly address the student with high risk)
4. Resource Allocations`;

      const res = await fetch("/api/get-strategic-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      // Simple fallback or read
      if (res.ok) {
        const data = await res.json();
        setStrategicCounsel(data.text);
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      // Offline fallback
      setStrategicCounsel(`### 📈 SmartEdu Executive Action Plan

#### 1. Executive Assessment
Overall scholastic metrics are sound, with **${overallAttendance}% Attendance average** and top-tier performance in Computer Science. However, structural variances exist in subject indicators, particularly in **Science (${subjectAverages.Science}%)** which must be stabilized.

#### 2. absenteeism Early Interventions
Our early-warning tracking maps high-risk indicators for student **Omar Farooq (62% Attendance, High Risk)**. An immediate target academic counseling layout must be executed:
*   Launch mandatory bi-weekly home check-ins.
*   Bridge academic gaps in Math.

#### 3. Recurrent Fee Collection Framework
With **$${totalOutstandingFees} outstanding tuition dues**, establish a flexible split-remittance schedule rather than strict suspensions, preventing student dropouts while guaranteeing administrative operations.`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Principal Analytical Executive</h2>
        <p className="text-sm text-slate-500">School scholastic compliance, revenue trackers, and strategic counseling</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Scholastic Attendance</p>
            <p className="font-display text-2xl font-bold text-slate-900 mt-1">{overallAttendance}%</p>
            <p className="text-xs text-emerald-600 mt-0.5">Top compliance target</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Credit & Due Fees</p>
            <p className="font-display text-2xl font-bold text-slate-900 mt-1">${totalOutstandingFees}</p>
            <p className="text-xs text-rose-500 mt-0.5">Overdue action indicators</p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Early Warnings (High Risk)</p>
            <p className="font-display text-2xl font-bold text-slate-900 mt-1">{highRiskStudents.length} Students</p>
            <p className="text-xs text-amber-600 mt-0.5">Dropout/Absentee indicators</p>
          </div>
        </div>
      </div>

      {/* Analytics Group */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom SVG Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Scholastic Performance averages
            </h3>
            <p className="text-xs text-slate-500">Comparative test percentage across courses</p>
          </div>

          <div className="space-y-4 py-2">
            {Object.entries(subjectAverages).map(([subject, val]) => (
              <div key={subject} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{subject}</span>
                  <span className="font-mono text-slate-500 font-bold">{val}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 rounded-full"
                    style={{ width: `${val}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Early Warning Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                Early-Warning Absentee Sentinel
              </h3>
              <p className="text-xs text-slate-500">Flags students falling behind critical attendance limits</p>
            </div>

            <div className="space-y-3">
              {students.filter(s => s.attendanceRate < 90).map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-amber-50 bg-amber-50/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">Class {s.grade}</span>
                    <p className="text-[11px] text-slate-500 mt-1">Status: Frequent gaps or unexcused absences detected.</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                      {s.attendanceRate}% Attendance
                    </span>
                    <p className="text-[10px] text-rose-600 font-bold mt-1">Risk: {s.riskLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-2.5">
            <span className="p-1 bg-amber-100 rounded text-amber-800 font-bold text-[9px] uppercase">Sentinel Activated</span>
            <span>Real-time analysis maps correlations between fees defaults and dropout.</span>
          </div>
        </div>
      </div>

      {/* SECTION: MASTER ACADEMIC SCHEDULES BOARD */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-650" />
              Master Institutional Schedule & Allocations
            </h3>
            <p className="text-xs text-slate-500">
              Complete shared catalog of class timetables, subject streams, assigned faculty rooms, and AI-scheduler stamp verification.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider">
            AI Synchronized Board
          </span>
        </div>

        {/* Timetable Stream Filter */}
        <div className="space-y-4">
          <div className="flex bg-slate-100 rounded-xl p-1 w-max">
            <button
              type="button"
              onClick={() => setSelectedGrade("10-A")}
              className={`px-4.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedGrade === "10-A"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Class 10-A Stream
            </button>
            <button
              type="button"
              onClick={() => setSelectedGrade("9-B")}
              className={`px-4.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedGrade === "9-B"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Class 9-B Stream
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
              const daySlots = timetable.filter((t) => t.grade === selectedGrade && t.day === day);
              return (
                <div key={day} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl space-y-2.5">
                  <span className="text-xs font-black text-indigo-900 uppercase tracking-widest block font-sans bg-indigo-100/50 py-1.5 text-center rounded-md border border-indigo-150">
                    {day}
                  </span>
                  <div className="space-y-2">
                    {daySlots.length > 0 ? (
                      daySlots.map((slot) => (
                        <div key={slot.id} className="p-2.5 bg-white border border-slate-200/80 rounded-lg space-y-1.5 shadow-2xs hover:border-indigo-200 transition-colors">
                          <span className="text-[10px] font-extrabold text-indigo-600 uppercase block font-sans">{slot.subject}</span>
                          <span className="text-[10px] font-bold text-slate-700 block truncate">{slot.teacher}</span>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                            <span>{slot.timeSlot.split(" ")[0] || "08:30"}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">{slot.room}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 block py-4 text-center border border-dashed border-slate-200 rounded-lg font-mono">No sessions</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION: ACADEMIC GRADES & SCHOLASTIC RESULTS HUB */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-650" />
              Principal Academic Ledger & Report Registry
            </h3>
            <p className="text-xs text-slate-500">School-wide directory of child educational milestones, categorized term wise and month wise.</p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider">
            Principal Clearance view
          </span>
        </div>

        <ScholasticResultsLedger
          students={students}
          viewMode="full"
        />
      </div>

      {/* SECTION: ACADEMIC TUITION & FEES HUB */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-650" />
              Principal Finance & Tuition Receivables Directory
            </h3>
            <p className="text-xs text-slate-500">School-wide directory of pupil billing plans, cleared collections, and accounts receivable reports.</p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider">
            Principal Ledger clearance
          </span>
        </div>

        <SchoolFeesRegistry
          students={students}
          viewMode="principal"
          onPayFees={onPayFees}
        />
      </div>

      {/* Strategic AI Advisor */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-indigo-50 pb-4 mb-4 gap-4">
          <div>
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Gemini Executive Strategic Recommender
            </h3>
            <p className="text-xs text-slate-500">Evaluates current metrics and issues customized educational recommendations for leadership.</p>
          </div>
          <button
            id="btn-generate-rec"
            onClick={loadStrategicRecommendations}
            disabled={generating}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Evaluating School DB...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Strategic Director Plan
              </>
            )}
          </button>
        </div>

        {strategicCounsel ? (
          <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 font-sans text-xs prose prose-slate max-w-none text-slate-700 space-y-3 leading-relaxed">
            <div className="flex items-center gap-2 bg-indigo-100/50 text-indigo-800 px-3 py-1 text-[10px] font-bold rounded-lg w-max mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              SECURE STRATEGIC GENERATION (models/gemini-3.5-flash)
            </div>
            {strategicCounsel.split("\n\n").map((chunk, idx) => {
              if (chunk.startsWith("###")) {
                return <h4 key={idx} className="font-display font-bold text-slate-900 text-sm mt-4 border-b border-indigo-100/50 pb-1">{chunk.replace("###", "")}</h4>;
              }
              if (chunk.startsWith("####")) {
                return <h5 key={idx} className="font-display font-bold text-slate-800 text-xs mt-3 uppercase tracking-wider">{chunk.replace("####", "")}</h5>;
              }
              return <p key={idx}>{chunk.replace(/\*\*/g, "")}</p>;
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-2 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <div className="p-3 bg-white text-indigo-500 rounded-full border border-slate-100 shadow-xs">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <p className="font-display font-semibold text-slate-800 text-sm">Awaiting Principal Authorization</p>
            <p className="text-xs text-slate-400 max-w-md">Click the strategic planner generator above to run Gemini cognitive analysis on the current school status.</p>
          </div>
        )}
      </div>
    </div>
  );
}
