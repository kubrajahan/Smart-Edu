/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GraduationCap, Users, Calendar, Award, Sparkles, Plus, BookOpen, Check, FileText, CheckCircle2, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Student, Teacher, LessonPlan, GeneratedExam, TimetableEntry } from "../types";
import ScholasticResultsLedger from "./ScholasticResultsLedger";

interface TeacherDashboardProps {
  students: Student[];
  teachers: Teacher[];
  timetable: TimetableEntry[];
  lessonPlans: LessonPlan[];
  generatedExams: GeneratedExam[];
  onUpdateAttendance: (studentId: string, date: string, status: "Present" | "Absent" | "Excused") => Promise<void>;
  onLogGrade: (
    studentId: string,
    subject: string,
    score: number,
    category?: "Monthly" | "Midterm" | "Final Term",
    periodName?: string,
    remarks?: string
  ) => Promise<void>;
  loggedInTeacherId?: string | null;
  onLogout?: () => void;
}

export default function TeacherDashboard({
  students,
  teachers,
  timetable = [],
  lessonPlans,
  generatedExams,
  onUpdateAttendance,
  onLogGrade,
  loggedInTeacherId,
  onLogout
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<"classes" | "timetable" | "lesson" | "exam" | "report" | "predict" | "results">("classes");
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [scopeFilter, setScopeFilter] = useState<"mine" | "all">("mine");

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<{ [key: string]: "Present" | "Absent" | "Excused" }>({});
  const [gradeInputs, setGradeInputs] = useState<{ [key: string]: string }>({});
  const [remarksInputs, setRemarksInputs] = useState<{ [key: string]: string }>({});
  const [gradeSubject, setGradeSubject] = useState("Mathematics");
  const [gradeCategory, setGradeCategory] = useState<"Monthly" | "Midterm" | "Final Term">("Monthly");
  const [gradePeriodName, setGradePeriodName] = useState("January");

  // AI states
  const [lessonPlanSubject, setLessonPlanSubject] = useState("Mathematics");
  const [lessonPlanGrade, setLessonPlanGrade] = useState("10-A");
  const [lessonPlanTopic, setLessonPlanTopic] = useState("");
  const [activePlanResult, setActivePlanResult] = useState<any | null>(null);

  const [examSubject, setExamSubject] = useState("Mathematics");
  const [examGrade, setExamGrade] = useState("10-A");
  const [examDifficulty, setExamDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [examTitle, setExamTitle] = useState("");
  const [numMcq, setNumMcq] = useState(5);
  const [numShort, setNumShort] = useState(3);
  const [numLong, setNumLong] = useState(2);
  const [marksMcq, setMarksMcq] = useState(2);
  const [marksShort, setMarksShort] = useState(5);
  const [marksLong, setMarksLong] = useState(10);
  const [activeExamResult, setActiveExamResult] = useState<any | null>(null);

  const [reportStudentId, setReportStudentId] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [activeReportResult, setActiveReportResult] = useState<any | null>(null);

  const [predictStudentId, setPredictStudentId] = useState("");
  const [activePredictResult, setActivePredictResult] = useState<any | null>(null);

  const [loadingAI, setLoadingAI] = useState(false);

  // Filter students based on selection
  const classStudents = students.filter((s) => s.grade === selectedClass);

  const handleAttendanceChange = (studentId: string, status: "Present" | "Absent" | "Excused") => {
    setAttendanceStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async (studentId: string) => {
    const status = attendanceStatus[studentId] || "Present";
    await onUpdateAttendance(studentId, attendanceDate, status);
  };

  const submitGrade = async (studentId: string) => {
    const score = gradeInputs[studentId];
    if (!score) return;
    const category = gradeCategory;
    const periodName = gradeCategory === "Monthly" ? gradePeriodName : (gradeCategory === "Midterm" ? "Midterm Exam" : "Final Term Exam");
    const remarks = remarksInputs[studentId] || "Logged via Gradebook Portal";

    await onLogGrade(studentId, gradeSubject, parseInt(score), category, periodName, remarks);
    setGradeInputs((prev) => ({ ...prev, [studentId]: "" }));
    setRemarksInputs((prev) => ({ ...prev, [studentId]: "" }));
  };

  const handleGenerateLessonPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonPlanTopic) return;
    setLoadingAI(true);
    setActivePlanResult(null);
    try {
      const res = await fetch("/api/school/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: lessonPlanSubject, grade: lessonPlanGrade, topic: lessonPlanTopic })
      });
      const data = await res.json();
      setActivePlanResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAI(true);
    setActiveExamResult(null);
    try {
      const res = await fetch("/api/school/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subject: examSubject, 
          grade: examGrade, 
          difficulty: examDifficulty, 
          examTitle,
          numMcq,
          numShort,
          numLong,
          marksMcq,
          marksShort,
          marksLong
        })
      });
      const data = await res.json();
      setActiveExamResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGenerateReportComments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportStudentId) return;
    setLoadingAI(true);
    setActiveReportResult(null);
    try {
      const res = await fetch("/api/school/report-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: reportStudentId, commentsText: reportNotes })
      });
      const data = await res.json();
      setActiveReportResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGeneratePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predictStudentId) return;
    setLoadingAI(true);
    setActivePredictResult(null);
    try {
      const res = await fetch("/api/school/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: predictStudentId })
      });
      const data = await res.json();
      setActivePredictResult(data.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const loggedInTeacherObj = teachers.find((t) => t.id === loggedInTeacherId);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-3 gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Educator Suite</h2>
          <p className="text-sm text-slate-500">Submit attendance, grade classes, and utilize cognitive classroom tools</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 w-max">
          <button
            onClick={() => { setSelectedClass("10-A"); }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${selectedClass === "10-A" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Class 10-A
          </button>
          <button
            onClick={() => { setSelectedClass("9-B"); }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${selectedClass === "9-B" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
          >
            Class 9-B
          </button>
        </div>
      </div>

      {loggedInTeacherObj && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between text-slate-800 shadow-xs gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600/15 border border-emerald-200 rounded-xl flex items-center justify-center font-bold text-emerald-700 font-mono text-sm">
              {loggedInTeacherObj.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-930">Educator Session active: {loggedInTeacherObj.name}</p>
              <p className="text-xs text-slate-500 font-medium">Department lead: <span className="font-semibold text-indigo-600">{loggedInTeacherObj.subject}</span> &bull; Credentials authorized</p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl border border-red-200/50 cursor-pointer shadow-xs transition-all text-center self-start sm:self-center shrink-0"
            >
              Sign Out & Lock Portal
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1.5">
        {[
          { id: "classes", label: "Class Roster & Grading", icon: GraduationCap },
          { id: "timetable", label: "Shared School Timetable", icon: Calendar },
          { id: "results", label: "Scholastic Results Ledger", icon: Award },
          { id: "lesson", label: "AI Lesson Planner", icon: Sparkles },
          { id: "exam", label: "AI Exam Generator", icon: FileText },
          { id: "report", label: "AI Report Comments", icon: BookOpen },
          { id: "predict", label: "AI Early Warning Forecast", icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); }}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/20"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1b. Shared School Timetable Tab */}
      {activeTab === "timetable" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-650" />
                Shared School Academic Timetable
              </h3>
              <p className="text-xs text-slate-500">
                View your custom teacher session plan or review class schedules across different student streams.
              </p>
            </div>
            
            {/* Filter controls */}
            <div className="flex bg-slate-100 rounded-xl p-1 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setScopeFilter("mine")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  scopeFilter === "mine"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                My Personal Lessons
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  scopeFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All School Classes
              </button>
            </div>
          </div>

          {scopeFilter === "mine" ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-xs text-indigo-800 flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Below are the lessons dynamically mapped to you (<strong className="font-semibold text-indigo-900">{loggedInTeacherObj?.name || "Educator"}</strong>, Subject: <strong className="font-semibold text-indigo-900">{loggedInTeacherObj?.subject}</strong>) across all student grades.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                  const daySlots = timetable.filter(
                    (t) =>
                      t.day === day &&
                      loggedInTeacherObj &&
                      (t.teacher.toLowerCase().includes(loggedInTeacherObj.name.toLowerCase()) || 
                       t.subject.toLowerCase() === loggedInTeacherObj.subject.toLowerCase())
                  );
                  return (
                    <div key={day} className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-xl space-y-2.5">
                      <span className="text-xs font-black text-indigo-900 uppercase tracking-widest block font-sans bg-indigo-100/50 py-1.5 text-center rounded-md border border-indigo-150">
                        {day}
                      </span>
                      <div className="space-y-2">
                        {daySlots.length > 0 ? (
                          daySlots.map((slot) => (
                            <div key={slot.id} className="p-2.5 bg-white border border-slate-200/85 rounded-lg space-y-1.5 shadow-3xs border-l-4 border-l-emerald-500">
                              <span className="text-[10px] font-black text-slate-500 block font-mono">CLASS {slot.grade}</span>
                              <span className="text-[11px] font-bold text-indigo-955 block leading-tight">{slot.subject}</span>
                              <div className="text-[9px] text-slate-400 font-mono flex flex-col gap-0.5 pt-1.5 border-t border-slate-100 mt-1">
                                <span className="font-semibold text-slate-650">{slot.timeSlot.split(" - ")[0] || "08:30 AM"}</span>
                                <span className="text-[10px] text-slate-700 font-bold">{slot.room}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 block py-6 text-center border border-dashed border-slate-200 rounded-lg font-mono">No assignments</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex bg-slate-100/80 p-1 rounded-lg w-max mb-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedClass("10-A")}
                  className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    selectedClass === "10-A" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Class 10-A Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClass("9-B")}
                  className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer ${
                    selectedClass === "9-B" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Class 9-B Schedule
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                  const daySlots = timetable.filter((t) => t.grade === selectedClass && t.day === day);
                  return (
                    <div key={day} className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-xl space-y-2.5">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest block font-sans bg-slate-200 py-1.5 text-center rounded-md border border-slate-200/60">
                        {day}
                      </span>
                      <div className="space-y-2">
                        {daySlots.length > 0 ? (
                          daySlots.map((slot) => {
                            const isMe = loggedInTeacherObj && slot.teacher.toLowerCase().includes(loggedInTeacherObj.name.toLowerCase());
                            return (
                              <div
                                key={slot.id}
                                className={`p-2.5 bg-white border rounded-lg space-y-1.5 shadow-3xs transition-all ${
                                  isMe ? "border-indigo-400 bg-indigo-50/10 ring-1 ring-indigo-100" : "border-slate-200/80"
                                }`}
                              >
                                <span className={`text-[10px] font-extrabold uppercase block font-sans ${isMe ? "text-indigo-650" : "text-slate-500"}`}>
                                  {slot.subject}
                                </span>
                                <span className="text-[10px] font-bold text-slate-850 block truncate">
                                  {isMe ? "⭐ You" : slot.teacher}
                                </span>
                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                                  <span>{slot.timeSlot.split(" - ")[0]}</span>
                                  <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold font-mono">{slot.room}</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-slate-400 block py-6 text-center border border-dashed border-slate-200 rounded-lg font-mono">No lessons</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. Classes Tab */}
      {activeTab === "classes" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List of students for selection */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/70">
              <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Active Attendance & Grades Summary
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 rounded outline-indigo-500 bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Roll ID</th>
                    <th className="p-4">Average attendance</th>
                    <th className="p-4">Mark Attendance</th>
                    <th className="p-4">Record Term Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Parent: {s.parentName}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-500">{s.rollNumber}</td>
                      <td className="p-4 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${s.attendanceRate > 90 ? "bg-emerald-50 text-emerald-800" : s.attendanceRate > 75 ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-rose-800"}`}>
                          {s.attendanceRate}%
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <select
                            value={attendanceStatus[s.id] || "Present"}
                            onChange={(e) => handleAttendanceChange(s.id, e.target.value as any)}
                            className="bg-white border border-slate-200 text-slate-700 rounded px-1.5 py-1 text-[11px] outline-indigo-500"
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Excused">Excused</option>
                          </select>
                          <button
                            onClick={() => submitAttendance(s.id)}
                            className="p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                            title="Log Attendance"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Score"
                            value={gradeInputs[s.id] || ""}
                            onChange={(e) => setGradeInputs({ ...gradeInputs, [s.id]: e.target.value })}
                            className="w-16 bg-white border border-slate-200 rounded px-1.5 py-1 text-[11px] outline-indigo-500 font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Optional Remarks"
                            value={remarksInputs[s.id] || ""}
                            onChange={(e) => setRemarksInputs({ ...remarksInputs, [s.id]: e.target.value })}
                            className="w-24 bg-white border border-slate-200 rounded px-1.5 py-1 text-[11px] outline-indigo-500"
                          />
                          <button
                            onClick={() => submitGrade(s.id)}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold rounded cursor-pointer shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Grading Overview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Subject Gradebook Selection
                </h3>
                <p className="text-xs text-slate-500 font-sans">Choose subject to analyze and record scores</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Course Subject</label>
                  <select
                    value={gradeSubject}
                    onChange={(e) => setGradeSubject(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg outline-indigo-500 font-medium text-slate-800"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assessment Term</label>
                  <select
                    value={gradeCategory}
                    onChange={(e) => setGradeCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg outline-indigo-500 font-medium text-slate-800"
                  >
                    <option value="Monthly">Monthly Test (Month Wise)</option>
                    <option value="Midterm">Midterm Examination</option>
                    <option value="Final Term">Final Term Examination</option>
                  </select>
                </div>

                {gradeCategory === "Monthly" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Month</label>
                    <select
                      value={gradePeriodName}
                      onChange={(e) => setGradePeriodName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg outline-indigo-500 font-medium text-slate-800"
                    >
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                    </select>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Class GAPs Breakdown</h4>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Passing Rate (&ge; 50):</span>
                      <span className="font-bold text-emerald-600">
                        {Math.round((classStudents.filter(s => (s.grades[gradeSubject] || 0) >= 50).length / classStudents.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Score:</span>
                      <span className="font-bold text-indigo-700">
                        {Math.round(classStudents.reduce((acc, s) => acc + (s.grades[gradeSubject] || 0), 0) / classStudents.length)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-400">
              <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
              <span>Entries sync securely in server-side storage across views.</span>
            </div>
          </div>
        </div>
      )}

      {/* Results Ledger Tab */}
      {activeTab === "results" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-display text-lg font-bold text-slate-900 border-b border-indigo-50 pb-3 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600 animate-pulse" />
                Classroom Academic Results Dashboard
              </span>
              <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 font-bold rounded-lg font-mono self-start sm:self-center border border-indigo-100">
                {loggedInTeacherObj?.name} &bull; {loggedInTeacherObj?.subject}
              </span>
            </h3>
            
            <ScholasticResultsLedger
              students={students}
              teacherSubject={loggedInTeacherObj?.subject}
              assignedGrades={loggedInTeacherObj?.assignedGrades}
            />
          </div>
        </div>
      )}

      {/* 2. Lesson tab */}
      {activeTab === "lesson" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-indigo-50 pb-3 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Automated AI Lesson Plan Generator
            </h3>

            <form onSubmit={handleGenerateLessonPlan} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                <select
                  value={lessonPlanSubject}
                  onChange={(e) => setLessonPlanSubject(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Grade</label>
                <select
                  value={lessonPlanGrade}
                  onChange={(e) => setLessonPlanGrade(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                >
                  <option value="10-A">Class 10-A</option>
                  <option value="9-B">Class 9-B</option>
                </select>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Active Curriculu/Syllabus Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quadratic Equations, Photosynthesis, Solar cells"
                    value={lessonPlanTopic}
                    onChange={(e) => setLessonPlanTopic(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingAI}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors flex items-center gap-2 self-end h-[38px] disabled:opacity-50"
                >
                  {loadingAI ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Create Plan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {activePlanResult && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-base">{activePlanResult.topic}</h4>
                  <p className="text-xs text-slate-500">Curriculum Course: {activePlanResult.subject} &bull; Target Grade: {activePlanResult.grade}</p>
                </div>
                <span className="text-[10px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-indigo-700 font-mono">
                  Copied to Class Directory
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
                <div className="md:col-span-1 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <h5 className="font-display font-bold text-slate-900 uppercase tracking-wide">1. Scholastic Objectives</h5>
                  <ul className="list-disc pl-4 space-y-1.5">
                    {activePlanResult.learningObjectives.map((obj: string, oi: number) => (
                      <li key={oi}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <h5 className="font-display font-bold text-slate-900 uppercase tracking-wide">2. Step-by-Step Activities Outline</h5>
                    <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                      {activePlanResult.activities.map((act: any, ai: number) => (
                        <div key={ai} className="p-3 flex items-start gap-4 hover:bg-slate-50/50">
                          <span className="p-1 px-2.5 bg-indigo-600 text-white rounded font-mono font-bold text-[10px] whitespace-nowrap">
                            {act.duration}
                          </span>
                          <p>{act.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="space-y-1">
                      <h5 className="font-display font-bold text-slate-900 uppercase tracking-wide text-[11px]">3. Target Assessments</h5>
                      <ul className="list-disc pl-4 space-y-1">
                        {activePlanResult.assessments.map((as: string, asi: number) => (
                          <li key={asi}>{as}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-display font-bold text-slate-900 uppercase tracking-wide text-[11px]">4. Assigned Homework</h5>
                      <p className="p-3 bg-indigo-50/30 text-indigo-900 rounded-lg border border-indigo-100/30">
                        {activePlanResult.homework}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Exam tab */}
      {activeTab === "exam" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-indigo-50 pb-3 mb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              Automated AI Exam & Quiz Questions Generator
            </h3>

            <form onSubmit={handleGenerateExam} className="space-y-6">
              {/* Row 1: Core details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Grade</label>
                  <select
                    value={examGrade}
                    onChange={(e) => setExamGrade(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                  >
                    <option value="10-A">Class 10-A</option>
                    <option value="9-B">Class 9-B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Difficulty</label>
                  <select
                    value={examDifficulty}
                    onChange={(e) => setExamDifficulty(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                  >
                    <option value="Easy">Easy Level</option>
                    <option value="Medium">Medium Level</option>
                    <option value="Hard">Hard Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Syllabus Quiz Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Term 2 Quiz"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                  />
                </div>
              </div>

              {/* Row 2: Counts and individual marks configuration */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3 font-mono">
                  Configure Question counts and individual marks allocation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Category A: MCQ */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-800 block mb-2 font-mono">Multiple Choice Questions</span>
                    <div className="grid grid-cols-2 gap-2">
                       <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">No. of MCQs</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={numMcq}
                          onChange={(e) => setNumMcq(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-indigo-500 text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Mark per MCQ</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={marksMcq}
                          onChange={(e) => setMarksMcq(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-indigo-500 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category B: Short Questions */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-800 block mb-2 font-mono">Short Answer Questions</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">No. of Questions</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={numShort}
                          onChange={(e) => setNumShort(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-indigo-500 text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Mark per Question</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={marksShort}
                          onChange={(e) => setMarksShort(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-indigo-500 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category C: Long/Essay Questions */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-100 flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-800 block mb-2 font-mono">Long/Essay Questions</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">No. of Questions</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={numLong}
                          onChange={(e) => setNumLong(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-indigo-500 text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Mark per Question</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={marksLong}
                          onChange={(e) => setMarksLong(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-indigo-500 text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button Row */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loadingAI}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-3 rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2 h-[42px] disabled:opacity-50"
                >
                  {loadingAI ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating Exam Draft...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      Build Custom Exam
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {activeExamResult && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-base">{activeExamResult.title}</h4>
                  <p className="text-xs text-slate-500">Subject: {activeExamResult.subject} &bull; Difficulty: {activeExamResult.difficulty}</p>
                </div>
                <span className="text-[10px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-bold">
                  Exam Draft Created Successfully
                </span>
              </div>

              <div className="space-y-6 text-xs text-slate-700">
                {activeExamResult.questions.map((q: any, qi: number) => (
                  <div key={qi} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 relative">
                    <span className="absolute top-4 right-4 text-[10px] font-bold text-slate-400 font-mono">
                      Allocated: {q.marks} Marks
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm flex items-start gap-2">
                      <span className="bg-indigo-600 text-white p-1 rounded font-mono text-[10px] inline-block">Q {qi+1}</span>
                      {q.text}
                    </h5>

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 mt-2">
                        {q.options.map((opt: string, oi: number) => (
                          <div key={oi} className="p-2 border border-slate-200/60 bg-white rounded-lg opacity-85">
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 pl-6 pt-2 border-t border-slate-200/40 text-emerald-800 font-semibold bg-emerald-50/40 p-2 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Grading Key: {q.answerKey}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Report comments */}
      {activeTab === "report" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-indigo-50 pb-3 mb-4">
              <Award className="w-5 h-5 text-indigo-500" />
              Cognitive AI Report Card Comments Generator
            </h3>

            <form onSubmit={handleGenerateReportComments} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Student</label>
                  <select
                    value={reportStudentId}
                    onChange={(e) => setReportStudentId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500 font-bold"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (GPA Avg: {Math.round(Object.values(s.grades).reduce((a,b)=>a+b,0) / Object.values(s.grades).length)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher Observations & Gaps Context</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="e.g. Needs to focus on mathematical concepts, has great presentation capabilities"
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={loadingAI || !reportStudentId}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors flex items-center gap-2 self-end h-[38px] disabled:opacity-50 whitespace-nowrap"
                    >
                      {loadingAI ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate Remarks
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {activeReportResult && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-rose-100 pb-3">
                <h4 className="font-display font-bold text-slate-900 text-base">Scholastic Commentary File</h4>
                <p className="text-xs text-slate-500">Student: {activeReportResult.studentName} &bull; Stream Grade: {activeReportResult.grade}</p>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[12px] leading-relaxed italic text-slate-700">
                  &ldquo;{activeReportResult.comments}&rdquo;
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 space-y-1.5">
                    <h5 className="font-bold text-emerald-800 uppercase tracking-wild text-[10px]">Academic Strengths</h5>
                    <ul className="list-disc pl-4 space-y-1">
                      {activeReportResult.strengths.map((str: string, si: number) => (
                        <li key={si} className="text-emerald-900">{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50 space-y-1.5">
                    <h5 className="font-bold text-amber-800 uppercase tracking-wild text-[10px]">Observed Gaps</h5>
                    <ul className="list-disc pl-4 space-y-1">
                      {activeReportResult.weaknesses.map((wk: string, wi: number) => (
                        <li key={wi} className="text-amber-900">{wk}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 space-y-1.5">
                    <h5 className="font-bold text-indigo-800 uppercase tracking-wild text-[10px]">Interventions advised</h5>
                    <ul className="list-disc pl-4 space-y-1">
                      {activeReportResult.recommendations.map((rc: string, ri: number) => (
                        <li key={ri} className="text-indigo-900">{rc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Predict tab */}
      {activeTab === "predict" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-indigo-50 pb-3 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Machine Learning Academic Performance Forecast (Early Warning Sentinel)
            </h3>

            <form onSubmit={handleGeneratePrediction} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Student for Early Warning Risk Modeling</label>
                <select
                  value={predictStudentId}
                  onChange={(e) => setPredictStudentId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500 font-bold"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Current Attendance: {s.attendanceRate}%, Risk: {s.riskLevel})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingAI || !predictStudentId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-2 h-[38px] disabled:opacity-50 w-full"
              >
                {loadingAI ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Running Model GAPs Analysis...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5" />
                    Analyze Risk Matrix
                  </>
                )}
              </button>
            </form>
          </div>

          {activePredictResult && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-base">Academic Predictive Sentinel Forecast</h4>
                  <p className="text-xs text-slate-500">Student Forecast File: {activePredictResult.studentName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Calculated Terminal Dropout Risk:</span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                    activePredictResult.dropoutRisk === "High" ? "bg-rose-100 text-rose-800" :
                    activePredictResult.dropoutRisk === "Medium" ? "bg-amber-100 text-amber-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>
                    {activePredictResult.dropoutRisk} Risk
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center items-center text-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-sans">Projected average score</span>
                  <p className="font-display text-4xl font-extrabold text-indigo-700 mt-2">{activePredictResult.predictedScore}%</p>
                  <span className="text-[10px] text-slate-400 mt-1">Under current absenteeism variables</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wild flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Causal Risk Analysis
                  </h5>
                  <p className="leading-relaxed">{activePredictResult.riskAnalysis}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <h5 className="font-bold text-slate-900 uppercase tracking-wild">Active Interventions Roadmap</h5>
                  <ul className="list-disc pl-4 space-y-1 font-semibold text-slate-600">
                    {activePredictResult.improvementStrategies.map((st: string, sti: number) => (
                      <li key={sti}>{st}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
