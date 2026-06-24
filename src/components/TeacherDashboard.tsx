/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { GraduationCap, Users, Calendar, Award, Sparkles, Plus, BookOpen, Check, FileText, CheckCircle2, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { Student, Teacher, LessonPlan, GeneratedExam, TimetableEntry, Course, SchoolClass } from "../types";
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
  courses: Course[];
  classes: SchoolClass[];
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
  onLogout,
  courses = [],
  classes = []
}: TeacherDashboardProps) {
  const loggedInTeacherObj = useMemo(() => teachers.find((t) => t.id === loggedInTeacherId), [teachers, loggedInTeacherId]);

  const allowedClasses = useMemo(() => {
    if (!loggedInTeacherObj) return classes;
    
    const isClassTeacherOf = loggedInTeacherObj.classTeacherOf;
    const isClassTeacherId = loggedInTeacherObj.id;
    const assignedGrades = loggedInTeacherObj.assignedGrades || [];
    
    const filtered = classes.filter(c => {
      const isClassTeacher = c.name === isClassTeacherOf || c.classTeacherId === isClassTeacherId;
      const isAssignedToTeach = assignedGrades.includes(c.name);
      return isClassTeacher || isAssignedToTeach;
    });
    
    if (filtered.length > 0) return filtered;
    return classes;
  }, [classes, loggedInTeacherObj, loggedInTeacherId]);

  const [activeTab, setActiveTab] = useState<"classes" | "timetable" | "lesson" | "exam" | "report" | "predict" | "results">("classes");
  const [selectedClass, setSelectedClass] = useState("10-A");

  useEffect(() => {
    if (allowedClasses.length > 0 && !allowedClasses.some(c => c.name === selectedClass)) {
      setSelectedClass(allowedClasses[0].name);
    }
  }, [allowedClasses, selectedClass]);

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
  const [reportScope, setReportScope] = useState<"student" | "class">("student");
  const [reportType, setReportType] = useState<"full" | "fee" | "exam">("full");
  const [customReportSubject, setCustomReportSubject] = useState("Mathematics");

  const [predictStudentId, setPredictStudentId] = useState("");
  const [activePredictResult, setActivePredictResult] = useState<any | null>(null);

  const [loadingAI, setLoadingAI] = useState(false);

  // Filter students based on selection
  const classStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesGrade = s.grade === selectedClass;
      const isAllowed = allowedClasses.some(c => c.name === s.grade);
      return matchesGrade && isAllowed;
    });
  }, [students, selectedClass, allowedClasses]);

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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-3 gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Educator Suite</h2>
          <p className="text-sm text-slate-500">Submit attendance, grade classes, and utilize cognitive classroom tools</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 w-max gap-1">
          {allowedClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => { setSelectedClass(cls.name); }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${selectedClass === cls.name ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
            >
              Class {cls.name}
            </button>
          ))}
          {allowedClasses.length === 0 && (
            <span className="text-[10px] text-slate-400 p-1.5 font-mono">No assigned classes</span>
          )}
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

      {/* 4. Upgraded Report and Consolidated Transcript Portal */}
      {activeTab === "report" && (
        <div className="space-y-6">
          {/* Main Controls Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-50 pb-4 mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Scholastic Progress & Official Transcript Engine
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Generate beautiful, printable report card documents, exam results sheets, and financial invoice ledgers for parents.
                </p>
              </div>

              {/* Scope Toggles */}
              <div className="flex bg-slate-100 rounded-lg p-1 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setReportScope("student")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    reportScope === "student"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Individual Student
                </button>
                <button
                  type="button"
                  onClick={() => setReportScope("class")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    reportScope === "class"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Cumulative Class
                </button>
              </div>
            </div>

            {/* Config Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Type of Report Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">1. Report Modality</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full text-xs font-bold p-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500 text-slate-800 cursor-pointer"
                >
                  <option value="full">I) Official Full Report</option>
                  <option value="fee">II) Consolidated Fee Report</option>
                  <option value="exam">III) Comprehensive Exam Report</option>
                </select>
              </div>

              {/* Student Selected (If individual) or Class (If cumulative) */}
              {reportScope === "student" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">2. Target Student</label>
                  <select
                    value={reportStudentId || (students[0]?.id || "")}
                    onChange={(e) => setReportStudentId(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500 text-slate-800 cursor-pointer"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Roll: {s.rollNumber || "N/A"} &bull; Class {s.grade})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">2. Target Stream Class</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500 text-indigo-700 cursor-pointer"
                  >
                    <option value="10-A">Class 10-A Stream</option>
                    <option value="9-B">Class 9-B Stream</option>
                  </select>
                </div>
              )}

              {/* Subject (if Exam report is selected) */}
              {reportType === "exam" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">3. Selected Subject</label>
                  <select
                    value={customReportSubject}
                    onChange={(e) => setCustomReportSubject(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border border-slate-200 bg-white rounded-xl outline-indigo-500 text-slate-800 cursor-pointer"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>
              ) : (
                <div className="opacity-45 pointer-events-none">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">3. Selected Subject</label>
                  <select disabled className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50 rounded-xl">
                    <option>All Collective Subjects</option>
                  </select>
                </div>
              )}

              {/* Printable Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-3 rounded-xl cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5 h-[38px]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Print & Handover
                </button>
              </div>
            </div>

            {/* AI Co-Pilot Enhancement Form */}
            <div className="mt-5 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl border border-slate-205">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                Empower report with Gemini AI Observations
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Instruct the AI to evaluate grade scores, compute behavioral weaknesses, and outline customized intervention plans.
              </p>
              <form onSubmit={handleGenerateReportComments} className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. Exhibited exceptional mathematical progress but struggles with rapid exam-prep timings."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 bg-white rounded-xl outline-indigo-500"
                />
                <button
                  type="submit"
                  disabled={loadingAI || (reportScope === "student" && !reportStudentId)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {loadingAI ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Generate AI Remarks
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ========================================================= */}
          {/* REPORT SHEET WORKSPACE - HIGH-FIDELITY PRINTABLE DESIGNS */}
          {/* ========================================================= */}
          {(() => {
            // Compute selected student
            const activeReportId = reportStudentId || (students[0]?.id || "");
            const currentStudent = students.find((s) => s.id === activeReportId) || students[0];
            
            if (!currentStudent) {
              return (
                <div className="bg-white p-8 rounded-2xl border text-center text-slate-400 font-medium">
                  Please register students in the database console to view official reports.
                </div>
              );
            }

            const classStudents = students.filter((s) => s.grade === (reportScope === "student" ? currentStudent.grade : selectedClass));
            const currentGradeText = reportScope === "student" ? currentStudent.grade : selectedClass;

            // Compute class averages
            const subjectsList = ["Mathematics", "Science", "English", "Social Studies", "Computer Science"];
            const classAverages: { [key: string]: number } = {};
            subjectsList.forEach((sub) => {
              const matchingScores = classStudents.map((s) => s.grades[sub] || 0);
              classAverages[sub] = matchingScores.length > 0 
                ? Math.round(matchingScores.reduce((a,b)=>a+b,0) / matchingScores.length)
                : 82;
            });

            const overallGPAClassAvg = Math.round(Object.values(classAverages).reduce((a,b)=>a+b,0) / Object.values(classAverages).length);

            // Compute student grade variables
            const studentGrades = currentStudent.grades || {};
            const averageStudentGrade = subjectsList.length > 0
              ? Math.round(subjectsList.reduce((acc, sub) => acc + (studentGrades[sub] || 85), 0) / subjectsList.length)
              : 85;

            // Letter Grades helper
            const getLetterGrade = (score: number) => {
              if (score >= 90) return { l: "A+", c: "text-emerald-700 bg-emerald-50 border-emerald-100" };
              if (score >= 80) return { l: "A", c: "text-emerald-600 bg-emerald-50/50 border-emerald-100/50" };
              if (score >= 70) return { l: "B", c: "text-blue-600 bg-blue-50 border-blue-100" };
              if (score >= 60) return { l: "C", c: "text-amber-600 bg-amber-50 border-amber-100" };
              return { l: "F", c: "text-red-650 bg-red-50 border-red-100" };
            };

            const classTeacherAssigned = teachers.find((t) => t.classTeacherOf === currentGradeText);

            return (
              <div className="bg-white rounded-2xl border border-slate-350 shadow-md p-8 max-w-[210mm] mx-auto space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 font-sans text-slate-900 relative">
                
                {/* Print watermark aesthetic header decoration */}
                <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-350 uppercase select-none print:block tracking-widest leading-none">
                  SmartEdu official audit copy &bull; ID: {currentStudent.id.toUpperCase()}
                </div>

                {/* Print Banner Top Header */}
                <div className="flex justify-between items-start border-b-[3px] border-indigo-650 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase bg-indigo-600 text-white px-2.5 py-1 rounded font-mono tracking-wider">
                      Official Transcripts Registry
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight uppercase">
                      SmartEdu International Academy
                    </h1>
                    <p className="text-xs text-slate-500 font-semibold tracking-wide">
                      Affiliated Board of Scholastic Excellence • Campus Registry Asia-Southeast
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="w-12 h-12 bg-indigo-50 border-2 border-indigo-650 text-indigo-700 rounded-xl flex items-center justify-center font-black text-lg select-none">
                      SE
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mt-1">
                      ESTD 2026
                    </span>
                  </div>
                </div>

                {/* Sub-Header Title */}
                <div className="text-center py-1.5 bg-slate-900 text-white rounded-lg select-none">
                  <h2 className="text-xs font-black uppercase tracking-wild py-1 font-mono">
                    {reportScope === "student" 
                      ? `I) OFFICIAL STUDENT PERFORMANCE PROFILE - TERM REPORT`
                      : `II) CLASS LEVEL ACADEMIC TRANSCRIPT SUMMARY`
                    }
                  </h2>
                </div>

                {/* Metadata block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  {reportScope === "student" ? (
                    <>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Student Name</span>
                        <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{currentStudent.name}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Class Section</span>
                        <span className="font-extrabold text-indigo-700 text-sm mt-0.5 block">Stream {currentStudent.grade}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Roll/Index No.</span>
                        <span className="font-mono font-bold text-slate-700 mt-0.5 block">{currentStudent.rollNumber || "ID-" + currentStudent.id.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Assigned Lead Teacher</span>
                        <span className="font-bold text-slate-900 mt-0.5 block">{classTeacherAssigned ? classTeacherAssigned.name : "Unassigned"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Class Stream</span>
                        <span className="font-extrabold text-indigo-700 text-lg mt-0.5 block">Stream {currentGradeText}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Total Enrolled</span>
                        <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{classStudents.length} Students</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Class GPA Average</span>
                        <span className="font-mono font-bold text-indigo-650 text-sm mt-0.5 block">{overallGPAClassAvg}% Cumulative</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Lead Class Teacher</span>
                        <span className="font-bold text-slate-900 mt-0.5 block">{classTeacherAssigned ? classTeacherAssigned.name : "Unassigned"}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* ============================================== */}
                {/* ADVANCED VECTOR VISUALIZATIONS (GRAPHS SECTION) */}
                {/* ============================================== */}
                <div className="border border-slate-205 rounded-xl p-5 space-y-3 bg-white">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block"></span>
                      Analytical Graph: {reportType === "full" ? "Performance Index vs Class Averages" : reportType === "fee" ? "Financial Allocations & Ledger Balance Status" : `Course Exams Distribution • ${customReportSubject}`}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">Generated Dynamically Via SmartEdu Vector Engine</span>
                  </div>

                  {/* Render Chart Content based on Type */}
                  {reportType === "full" && (
                    <div className="space-y-4">
                      {/* Dual Bar Chart Comparison */}
                      <div className="h-44 w-full flex items-end justify-between px-6 pt-4 border-b border-l border-slate-200 relative">
                        {/* Grid lines */}
                        <div className="absolute left-0 right-0 top-1/4 border-t border-slate-100 pointer-events-none"></div>
                        <div className="absolute left-0 right-0 top-2/4 border-t border-slate-100 pointer-events-none"></div>
                        <div className="absolute left-0 right-0 top-3/4 border-t border-slate-100 pointer-events-none"></div>

                        {/* Y-Axis Guideline Tags */}
                        <span className="absolute -left-5 top-0 text-[8px] font-mono text-slate-400">100%</span>
                        <span className="absolute -left-5 top-1/2 text-[8px] font-mono text-slate-400">50%</span>
                        <span className="absolute -left-5 bottom-0 text-[8px] font-mono text-slate-400">0%</span>

                        {/* Render Bars */}
                        {subjectsList.map((sub, idx) => {
                          const score = reportScope === "student" ? (studentGrades[sub] || 85) : classAverages[sub];
                          const comparison = classAverages[sub];
                          
                          return (
                            <div key={idx} className="flex flex-col items-center gap-1.5 w-1/5 group relative">
                              <div className="flex gap-1.5 items-end justify-center h-28 w-full max-w-16">
                                {/* Student Bar */}
                                <div 
                                  className="bg-indigo-600 hover:bg-indigo-700 rounded-t-xs text-white text-[8px] font-bold text-center flex flex-col justify-end transition-all pb-1 select-none"
                                  style={{ height: `${score}%`, width: `16px` }}
                                  title={`${reportScope === "student" ? "Your Score" : "Class Target"}: ${score}%`}
                                >
                                  {score >= 40 && <span className="-rotate-90 origin-center mb-1">{score}</span>}
                                </div>
                                {/* Average Bar */}
                                <div 
                                  className="bg-sky-200 hover:bg-sky-300 rounded-t-xs text-slate-600 text-[8px] font-medium text-center flex flex-col justify-end transition-all pb-1 select-none"
                                  style={{ height: `${comparison}%`, width: `16px` }}
                                  title={`Class Avg: ${comparison}%`}
                                >
                                  {comparison >= 40 && <span className="-rotate-90 origin-center mb-1 text-slate-700">{comparison}</span>}
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-slate-600 truncate max-w-full block">
                                {sub.substring(0, 7)}...
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legends */}
                      <div className="flex justify-center gap-6 text-[10px] font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 bg-indigo-600 rounded"></span>
                          <span>{reportScope === "student" ? `${currentStudent.name}'s Score` : "Class Stream Average"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 bg-sky-200 rounded"></span>
                          <span>Regional / Stream benchmark average</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === "fee" && (() => {
                    // Compute Outstanding Balances
                    const feesObj = currentStudent.schoolFeesStatus || { total: 1000, paid: 1000, due: 0, status: "Paid" };
                    const totalFees = reportScope === "student" 
                      ? feesObj.total 
                      : classStudents.reduce((acc, s) => acc + (s.schoolFeesStatus?.total || 1000), 0);
                    const paidFees = reportScope === "student" 
                      ? feesObj.paid 
                      : classStudents.reduce((acc, s) => acc + (s.schoolFeesStatus?.paid || 1000), 0);
                    const dueFees = totalFees - paidFees;
                    const paidPercentage = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 100;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        {/* Pizza / Donut SVG Chart representing financial allocation levels */}
                        <div className="flex justify-center py-2">
                          <svg width="150" height="150" viewBox="0 0 42 42" className="transform -rotate-90">
                            {/* Circle bases */}
                            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#F1F5F9" strokeWidth="6"></circle>
                            {/* Paid Segment */}
                            <circle 
                              cx="21" 
                              cy="21" 
                              r="15.915" 
                              fill="transparent" 
                              stroke="#10B981" 
                              strokeWidth="6" 
                              strokeDasharray={`${paidPercentage} ${100 - paidPercentage}`} 
                              strokeDashoffset="0"
                            ></circle>
                            {/* Inner Circle Label */}
                            <g className="transform rotate-90 origin-center">
                              <text x="50%" y="46%" dominantBaseline="middle" textAnchor="middle" className="text-[5px] font-black fill-slate-800 font-mono">
                                {paidPercentage}%
                              </text>
                              <text x="50%" y="62%" dominantBaseline="middle" textAnchor="middle" className="text-[3px] font-extrabold fill-slate-400 uppercase tracking-widest leading-none">
                                Paid
                              </text>
                            </g>
                          </svg>
                        </div>

                        <div className="space-y-3.5">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Financial Breakdown Balance Indicator</h4>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                              <span className="block text-[9px] text-emerald-700 font-bold uppercase">Paid Collection</span>
                              <span className="text-sm font-black text-emerald-800 font-mono">${paidFees}</span>
                            </div>
                            <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100">
                              <span className="block text-[9px] text-rose-700 font-bold uppercase">Pending Balance</span>
                              <span className="text-sm font-black text-rose-800 font-mono">${dueFees}</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 leading-relaxed font-sans mt-0.5">
                            {dueFees > 0 ? (
                              <p className="text-rose-650 font-semibold flex items-center gap-1">
                                ⚠ Notification: Outstandings detected. Reminder notices generated for parents.
                              </p>
                            ) : (
                              <p className="text-emerald-700 font-semibold flex items-center gap-1">
                                ✓ Complete: Account ledger clear. No alerts logged.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {reportType === "exam" && (
                    <div className="space-y-4">
                      {/* Class Exam curve representation for specific subject */}
                      <div className="h-40 w-full flex items-end justify-between px-6 pt-6 border-b border-l border-slate-200 relative">
                        {/* Guideline axes */}
                        <div className="absolute left-0 right-0 top-1/4 border-t border-slate-100/50 pointer-events-none"></div>
                        <div className="absolute left-0 right-0 top-2/4 border-t border-slate-100/50 pointer-events-none"></div>
                        <div className="absolute left-0 right-0 top-3/4 border-t border-slate-100/50 pointer-events-none"></div>

                        {/* Chart Line Representation */}
                        {reportScope === "student" ? (
                          (() => {
                            // Render student's progress coordinates
                            const score = studentGrades[customReportSubject] || 85;
                            // Dummy trends over Month | Mid | Final
                            const pts = [
                              { l: "Monthly Assessment", v: Math.max(score - 10, 45) },
                              { l: "Midterm Examinations", v: Math.max(score - 3, 50) },
                              { l: "Final Examinations", v: score }
                            ];
                            return (
                              <div className="absolute inset-0 left-6 right-6 top-6 bottom-0 flex justify-between items-end pointer-events-none">
                                {pts.map((pt, i) => (
                                  <div key={i} className="flex flex-col items-center w-1/3 relative z-10" style={{ height: "100%" }}>
                                    <div 
                                      className="absolute w-3.5 h-3.5 bg-indigo-650 border-2 border-white rounded-full shadow-sm text-center font-bold text-white text-[9px]"
                                      style={{ bottom: `calc(${pt.v}% - 7px)` }}
                                    ></div>
                                    <span 
                                      className="absolute text-[9px] font-black text-indigo-700"
                                      style={{ bottom: `calc(${pt.v}% + 10px)` }}
                                    >
                                      {pt.v}%
                                    </span>
                                    <span className="absolute bottom-1 text-[9px] font-bold text-slate-400">{pt.l}</span>
                                  </div>
                                ))}
                                {/* Connect direct lines with SVG overlays */}
                                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                                  <path 
                                    d={`M 0 ${160 - (pts[0].v / 100 * 160)} L 150 ${160 - (pts[1].v / 100 * 160)} L 300 ${160 - (pts[2].v / 100 * 160)}`} 
                                    fill="none" 
                                    stroke="#4F46E5" 
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                  ></path>
                                </svg>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="w-full flex justify-around text-xs">
                            {classStudents.map((s, idx) => {
                              const examScore = s.grades[customReportSubject] || 82;
                              const { l: word } = getLetterGrade(examScore);
                              return (
                                <div key={idx} className="flex flex-col items-center justify-end h-full w-12 gap-1 pb-1">
                                  <span className="text-[10px] font-bold text-indigo-600">{examScore}%</span>
                                  <div 
                                    className="bg-indigo-600 hover:bg-indigo-700 w-5 rounded-t-xs"
                                    style={{ height: `${examScore}%` }}
                                  ></div>
                                  <span className="text-[9px] font-bold text-slate-500 font-mono truncate w-12 text-center" title={s.name}>
                                    {s.name.substring(0, 5)}...
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ================================================= */}
                {/* DETAILED DATA SHEETS (CONSOLIDATED TABLES BLOCK) */}
                {/* ================================================= */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 border-b pb-1.5 flex items-center justify-between">
                    <span>Performance Ledgers Ledger Card Data</span>
                    <span className="text-[10px] text-slate-405 lowercase">Session: Spring Term &bull; Grade Stream 2026</span>
                  </h3>

                  {reportType === "full" && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-mono uppercase text-[10px] select-none">
                            <th className="p-3">Core Subject Topic</th>
                            <th className="p-3 text-center">Score Grade</th>
                            <th className="p-3 text-center">Benchmark Grade</th>
                            <th className="p-3 text-center">Relative Standing</th>
                            <th className="p-3">Assigned Assessment Comment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {subjectsList.map((sub, idx) => {
                            const score = reportScope === "student" ? (studentGrades[sub] || 85) : classAverages[sub];
                            const { l: letter, c: classes } = getLetterGrade(score);
                            const benchmark = classAverages[sub];
                            const diff = score - benchmark;

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800">{sub}</td>
                                <td className="p-3 text-center">
                                  <span className="font-mono text-[12px] font-black">{score}%</span>
                                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-black font-mono border ${classes}`}>
                                    {letter}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-mono font-medium text-slate-500">{benchmark}%</td>
                                <td className="p-3 text-center">
                                  {diff > 0 ? (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-mono">+{diff} pts</span>
                                  ) : diff < 0 ? (
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-mono">{diff} pts</span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded font-mono">Even</span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-500 italic max-w-[200px] truncate" title={`${sub} core competencies clear.`}>
                                  Highly collaborative. Fulfills syllabus objectives perfectly.
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {reportType === "fee" && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                      {reportScope === "student" ? (
                        <>
                          {/* Student Invoice Details */}
                          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Total Obligation</span>
                              <p className="text-base font-black text-slate-950 font-mono">${currentStudent.schoolFeesStatus?.total || 1200}</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Paid Realized</span>
                              <p className="text-base font-black text-emerald-700 font-mono">${currentStudent.schoolFeesStatus?.paid || 1200}</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400">Due Outstanding</span>
                              <p className={`text-base font-black font-mono ${ (currentStudent.schoolFeesStatus?.due || 0) > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                                ${currentStudent.schoolFeesStatus?.due || 0}
                              </p>
                            </div>
                          </div>
                          
                          <table className="w-full text-left font-mono text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-white uppercase text-[9px] select-none">
                                <th className="p-3">Transaction Date</th>
                                <th className="p-3">Reference Item</th>
                                <th className="p-3">Channel Method</th>
                                <th className="p-3 text-right">Credit Amount</th>
                                <th className="p-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {currentStudent.schoolFeesStatus?.paymentHistory && currentStudent.schoolFeesStatus.paymentHistory.length > 0 ? (
                                currentStudent.schoolFeesStatus.paymentHistory.map((h: any, hi: number) => (
                                  <tr key={hi} className="hover:bg-slate-50/50">
                                    <td className="p-3">{h.date}</td>
                                    <td className="p-3 font-sans font-semibold text-slate-800">Term-Fee Installment</td>
                                    <td className="p-3 uppercase">{h.method || "Direct Bank Transfer"}</td>
                                    <td className="p-3 text-right font-bold text-emerald-800">${h.amount}</td>
                                    <td className="p-3 text-center">
                                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-sans font-bold border border-emerald-100 text-[10px]">
                                        Verified Credit
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td className="p-3">2026-01-15</td>
                                  <td className="p-3 font-sans font-semibold text-slate-800">Seeded Semester Tuition</td>
                                  <td className="p-3 uppercase">Online Portal</td>
                                  <td className="p-3 text-right font-bold text-emerald-800">${currentStudent.schoolFeesStatus?.paid || 1200}</td>
                                  <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-sans font-bold border border-emerald-100 text-[10px]">
                                      Verified Credit
                                    </span>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </>
                      ) : (
                        <table className="w-full text-left font-mono text-[11px] border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-white uppercase text-[9px] select-none">
                              <th className="p-3">Pupil Student</th>
                              <th className="p-3">Invoice Total</th>
                              <th className="p-3">Paid Ledger</th>
                              <th className="p-3">Outstanding Dues</th>
                              <th className="p-3 text-center">Compliance Standing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-sans font-medium text-xs">
                            {classStudents.map((s) => {
                              const f = s.schoolFeesStatus || { total: 1000, paid: 1000, due: 0, status: "Paid" };
                              return (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-semibold text-slate-950">{s.name}</td>
                                  <td className="p-3 font-mono">${f.total}</td>
                                  <td className="p-3 font-mono text-emerald-700 font-bold">${f.paid}</td>
                                  <td className="p-3 font-mono text-rose-600 font-bold">${f.total - f.paid}</td>
                                  <td className="p-3 text-center">
                                    {f.total - f.paid === 0 ? (
                                      <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-850 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Cleared</span>
                                    ) : (
                                      <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-850 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Due Pending</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {reportType === "exam" && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white font-mono uppercase text-[10px] select-none">
                            <th className="p-3">Pupil Candidate Name</th>
                            <th className="p-3">Subject Assessment</th>
                            <th className="p-3 text-center">Achieved Score</th>
                            <th className="p-3 text-center">Class Rank Percentile</th>
                            <th className="p-3">Teacher Recommendation Commentary</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {classStudents.map((s, sidx) => {
                            const studentSubScore = s.grades[customReportSubject] || 80;
                            const { l: level, c: style } = getLetterGrade(studentSubScore);
                            return (
                              <tr key={sidx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-950">{s.name}</td>
                                <td className="p-3 font-semibold text-slate-500">{customReportSubject}</td>
                                <td className="p-3 text-center">
                                  <span className="font-mono text-sm font-black">{studentSubScore}%</span>
                                  <span className={`ml-1.5 text-[10px] px-2 py-0.5 border font-black font-mono rounded ${style}`}>
                                    {level}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-mono font-medium text-slate-650">
                                  Top {Math.max(5, 100 - (studentSubScore / 105) * 100).toFixed(0)}%
                                </td>
                                <td className="p-3 text-slate-500 italic max-w-xs truncate" title="Exhibited consistent conceptual alignment and structured test methodology.">
                                  Exhibited consistent alignment and logical reasoning.
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ==================================== */}
                {/* AI-POWERED BEHAVIORAL COMMENTARY BOX */}
                {/* ==================================== */}
                <div className="p-5 bg-sky-50/40 rounded-xl border border-sky-100 space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#1E3A8A] flex items-center gap-1.5 select-none">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    AUTHORIZED BEHAVIORAL COGNITIVE OBSERVATION COMMENTARY
                  </h4>
                  
                  {activeReportResult && reportScope === "student" && activeReportResult.studentName === currentStudent.name ? (
                    <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans mt-1">
                      <div className="italic leading-relaxed text-slate-800 p-3.5 bg-white border rounded-lg whitespace-pre-line">
                        &ldquo;{activeReportResult.comments}&rdquo;
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100/65">
                          <span className="block text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1">Areas of Excellence</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-emerald-900 font-semibold text-[10.5px]">
                            {activeReportResult.strengths?.map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100/65">
                          <span className="block text-[9px] font-bold text-amber-800 uppercase tracking-widest mb-1">Target Development Areas</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-amber-950 font-semibold text-[10.5px]">
                            {activeReportResult.weaknesses?.map((w: string, idx: number) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100/65">
                          <span className="block text-[9px] font-bold text-indigo-800 uppercase tracking-widest mb-1">Remedial Action Plans</span>
                          <ul className="list-disc pl-4 space-y-0.5 text-indigo-950 font-semibold text-[10.5px]">
                            {activeReportResult.recommendations?.map((r: string, idx: number) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 leading-relaxed italic border border-slate-100 bg-white/70 p-4 rounded-xl mt-1 space-y-2">
                      <p>
                        &ldquo;{currentStudent.name} demonstrates excellent conceptual adaptability. Their attention to stream curricula benchmarks is praiseworthy, maintaining an overall attendance rate of {currentStudent.attendanceRate || 95}%. Continued collaborative practices in classroom groups will ensure scholastic growth.&rdquo;
                      </p>
                      <div className="grid grid-cols-3 gap-3 pt-2 text-[10px] font-semibold text-slate-500">
                        <div>
                          <strong className="text-emerald-700 uppercase tracking-wider block text-[9px]">Strengths:</strong>
                          Logical analysis, active participation.
                        </div>
                        <div>
                          <strong className="text-amber-700 uppercase tracking-wider block text-[9px]">Suggested Gaps:</strong>
                          Time-management under assessments.
                        </div>
                        <div>
                          <strong className="text-indigo-700 uppercase tracking-wider block text-[9px]">Advised Plan:</strong>
                          Targeted self-assessments regularly.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ========================================== */}
                {/* OFFICIAL SIGNATURES & ENDORSEMENTS (FOOTER) */}
                {/* ========================================== */}
                <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-200 text-xs">
                  {/* Stamp Seal Indicator */}
                  <div className="flex flex-col items-center justify-center relative select-none">
                    <div className="w-16 h-16 border-2 border-slate-300 rounded-full flex flex-col items-center justify-center font-bold text-[8px] text-slate-400 rotate-12 shrink-0">
                      <span>OFFICIAL SEAL</span>
                      <span>SMARTEDU</span>
                      <span className="text-[6px]">APPROVED</span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-1">Registry Stamp</span>
                  </div>

                  {/* Class Teacher Signature */}
                  <div className="flex flex-col items-center justify-end text-center">
                    <div className="h-8 border-b border-slate-400 w-full max-w-40 flex items-center justify-center font-mono text-[10px] italic text-slate-500 select-none">
                      {classTeacherAssigned ? classTeacherAssigned.name : "Class Instructor"}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mt-1">Class Teacher</span>
                  </div>

                  {/* Principal Endorsement */}
                  <div className="flex flex-col items-center justify-end text-center">
                    <div className="h-8 border-b border-slate-400 w-full max-w-40 flex items-center justify-center font-serif text-[11px] font-extrabold text-slate-700 select-none">
                      Dr. A. K. Sterling
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450 mt-1">Principal Executive</span>
                  </div>
                </div>

                {/* Print instructions stamp */}
                <div className="text-center text-[9px] text-slate-400 font-mono select-none pt-4">
                  SmartEdu Unified Portal System Academic Document &bull; Print Date: {new Date().toLocaleDateString()}
                </div>
              </div>
            );
          })()}
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
