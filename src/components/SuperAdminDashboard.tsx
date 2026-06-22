/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Users, GraduationCap, DollarSign, BookOpen, Truck, ListCollapse, Plus, Sparkles, Database, FileText, CheckCircle2, Shield, UserCheck, ShieldAlert, Key, Unlock, Trash2, Edit2, Check, RefreshCw, AlertCircle, Award, Coins } from "lucide-react";
import { Student, Teacher, LibraryBook, TransportRoute, LoginCredential, TimetableEntry } from "../types";
import ScholasticResultsLedger from "./ScholasticResultsLedger";
import SchoolFeesRegistry from "./SchoolFeesRegistry";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

interface SuperAdminDashboardProps {
  students: Student[];
  teachers: Teacher[];
  libraryBooks: LibraryBook[];
  transportRoutes: TransportRoute[];
  timetable: TimetableEntry[];
  onAddStudent: (student: any) => Promise<void>;
  onAddTimetableEntry: (entry: any) => Promise<void>;
  onDeleteTimetableEntry: (id: string) => Promise<void>;
  logins?: LoginCredential[];
  onAssignLogin: (loginData: any) => Promise<void>;
  onToggleLoginStatus: (loginId: string) => Promise<void>;
  onDeleteLogin: (loginId: string) => Promise<void>;
  onPayFees: (studentId: string, amount: number, method: string, remarks?: string) => Promise<boolean>;
  onUpdateFees: (studentId: string, total: number, status?: string) => Promise<boolean>;
  onSyncDatabase?: () => Promise<void>;
}

export default function SuperAdminDashboard({
  students,
  teachers,
  libraryBooks,
  transportRoutes,
  timetable,
  onAddStudent,
  onAddTimetableEntry,
  onDeleteTimetableEntry,
  logins = [],
  onAssignLogin,
  onToggleLoginStatus,
  onDeleteLogin,
  onPayFees,
  onUpdateFees,
  onSyncDatabase
}: SuperAdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<string>("exams");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    gender: "Male",
    grade: "10-A",
    rollNumber: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    schoolFeesStatus: { total: 1200, paid: 1200, due: 0, status: "Paid" }
  });

  const [newCourse, setNewCourse] = useState({
    grade: "10-A",
    day: "Monday" as const,
    subject: "Mathematics",
    teacher: "",
    timeSlot: "08:30 AM - 09:30 AM",
    room: "Room 101"
  });

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentGradeFilter, setStudentGradeFilter] = useState("All");

  const [logs, setLogs] = useState([
    { id: 1, action: "Gemini Lesson Planner", details: "Generated Science plan on 'Solar cells'", model: "gemini-3.5-flash", time: "10:14 AM" },
    { id: 2, action: "Database Update", details: "Aisha Rahman attendance updated to Present", model: "System", time: "09:30 AM" },
    { id: 3, action: "Gemini Early Warning Projector", details: "Analyzed risk of chronic absence on S2026-103", model: "gemini-3.5-flash", time: "09:12 AM" }
  ]);

  const [regSuccess, setRegSuccess] = useState(false);

  // Firestore cloud synchronization states has been integrated
  const [firestoreSyncing, setFirestoreSyncing] = useState(false);
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<string | null>(null);

  const handleSyncFirestore = async () => {
    setFirestoreSyncing(true);
    setFirestoreSyncStatus("Syncing registers to cloud...");
    try {
      // 1. Sync students
      for (const student of students) {
        await setDoc(doc(db, "students", student.id), student);
      }
      
      // 2. Sync teachers
      for (const teacher of teachers) {
        await setDoc(doc(db, "teachers", teacher.id), teacher);
      }
      
      // 3. Sync libraryBooks
      for (const book of libraryBooks) {
        await setDoc(doc(db, "libraryBooks", book.id), book);
      }
      
      // 4. Sync timetable
      for (const slot of timetable) {
        await setDoc(doc(db, "timetable", slot.id), slot);
      }

      setFirestoreSyncStatus("Cloud Firestore Synchronized!");
      
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLogs(prev => [
        {
          id: Date.now(),
          action: "Cloud Firestore Synced",
          details: `Uploaded ${students.length} students, ${teachers.length} teachers, ${libraryBooks.length} books, and ${timetable.length} schedule slots to Google Cloud Firestore collections.`,
          model: "Firebase",
          time: timeStr
        },
        ...prev
      ]);

      setTimeout(() => setFirestoreSyncStatus(null), 4000);
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.WRITE, "bulk-sync");
      } catch (formattedError) {
        alert(`Firestore Synchronization Failed: ${(formattedError as Error).message}`);
      }
      setFirestoreSyncStatus("Sync failed!");
      setTimeout(() => setFirestoreSyncStatus(null), 4000);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // AI Timetable states
  const [aiGenGrade, setAiGenGrade] = useState("All");
  const [aiGenPolicy, setAiGenPolicy] = useState<"replace" | "append">("replace");
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [aiGenStatus, setAiGenStatus] = useState<{ msg: string; mode: string } | null>(null);

  const handleAIGenerateTimetable = async () => {
    setAiGenLoading(true);
    setAiGenStatus(null);
    try {
      const res = await fetch("/api/school/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: aiGenGrade, action: aiGenPolicy })
      });
      const data = await res.json();
      if (data.success) {
        setAiGenStatus({
          msg: `Successfully generated ${data.count} conflict-free class lessons!`,
          mode: data.mode
        });
        
        // Push telemetry log of AI generation
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const traceAction = {
          id: Date.now(),
          action: "AI Timetable Generation",
          details: `Generated ${data.count} course schedules for ${aiGenGrade === 'All' ? 'all streams' : aiGenGrade} via Gemini AI. Shared directly with teacher and principal dashboards.`,
          model: "gemini-3.5-flash",
          time: timeStr
        };
        setLogs(prev => [traceAction, ...prev]);

        if (onSyncDatabase) {
          await onSyncDatabase();
        }
      } else {
        throw new Error(data.error || "Generation returned failure structure");
      }
    } catch (err: any) {
      console.error(err);
      setAiGenStatus({
        msg: `Failed to invoke Gemini AI scheduler. Running fallback roster compile.`,
        mode: "demo"
      });
    } finally {
      setAiGenLoading(false);
    }
  };

  useEffect(() => {
    if (!newCourse.teacher && teachers.length > 0) {
      setNewCourse(prev => ({ ...prev, teacher: teachers[0].name }));
    }
  }, [teachers]);

  const handleCourseRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddTimetableEntry({
        ...newCourse
      });
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const traceAction = {
        id: Date.now(),
        action: "Course Stream Registered",
        details: `Asscribed course ${newCourse.subject} to Stream Class ${newCourse.grade} with ${newCourse.teacher}`,
        model: "Database Log",
        time: timeStr
      };
      setLogs(prev => [traceAction, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  // Security Login Generation States
  const [assignUserType, setAssignUserType] = useState<"teacher" | "student" | "parent">("teacher");
  const [assignTargetId, setAssignTargetId] = useState("");
  const [assignUsername, setAssignUsername] = useState("");
  const [assignPassword, setAssignPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Auto-suggestion helper for login credentials
  useEffect(() => {
    if (assignUserType === "teacher") {
      const selected = teachers.find(t => t.id === assignTargetId) || teachers[0];
      if (selected) {
        setAssignTargetId(selected.id);
        const autoName = selected.name.toLowerCase().replace(/\s+/g, ".");
        setAssignUsername(autoName);
      } else {
        setAssignTargetId("");
        setAssignUsername("");
      }
    } else if (assignUserType === "student") {
      const selected = students.find(s => s.id === assignTargetId) || students[0];
      if (selected) {
        setAssignTargetId(selected.id);
        setAssignUsername(selected.rollNumber.toLowerCase());
      } else {
        setAssignTargetId("");
        setAssignUsername("");
      }
    } else if (assignUserType === "parent") {
      const selected = students.find(s => s.id === assignTargetId) || students[0];
      if (selected) {
        setAssignTargetId(selected.id);
        const autoName = `parent.${selected.rollNumber.toLowerCase()}`;
        setAssignUsername(autoName);
      } else {
        setAssignTargetId("");
        setAssignUsername("");
      }
    }
  }, [assignUserType, assignTargetId, teachers, students]);

  useEffect(() => {
    if (!assignPassword) {
      setAssignPassword(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
  }, []);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetId || !assignUsername || !assignPassword) {
      setLoginMsg({ text: "Please fulfill all required fields before dispatching credentials.", isError: true });
      return;
    }

    let targetName = "";
    if (assignUserType === "teacher") {
      const t = teachers.find(tch => tch.id === assignTargetId);
      targetName = t ? t.name : "Teacher";
    } else if (assignUserType === "student") {
      const s = students.find(std => std.id === assignTargetId);
      targetName = s ? s.name : "Student";
    } else {
      const s = students.find(std => std.id === assignTargetId);
      targetName = s ? s.parentName : "Parent";
    }

    try {
      await onAssignLogin({
        userType: assignUserType,
        targetId: assignTargetId,
        targetName,
        username: assignUsername,
        password: assignPassword
      });

      // Update local trace logs
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const traceAction = {
        id: Date.now(),
        action: "Authority Credential Dispatch",
        details: `Assigned secure entry credentials [${assignUsername}] to ${targetName} (${assignUserType})`,
        model: "Identity Proxy",
        time: timeStr
      };
      setLogs(prev => [traceAction, ...prev]);

      setLoginMsg({ text: `Security credentials mapped perfectly for ${targetName}!`, isError: false });
      setTimeout(() => setLoginMsg(null), 3000);
      
      // Reset default password suggestion
      setAssignPassword(Math.random().toString(36).substring(2, 10).toUpperCase());
    } catch (err: any) {
      setLoginMsg({ text: `Failed to map credentials: ${err.message || err}`, isError: true });
    }
  };

  const stats = [
    { label: "Total Students", value: students.length, color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: Users },
    { label: "Total Teachers", value: teachers.length, color: "bg-teal-50 text-teal-700 border-teal-100", icon: GraduationCap },
    { label: "Library Catalog", value: libraryBooks.reduce((acc, b) => acc + b.totalCopies, 0), color: "bg-rose-50 text-rose-700 border-rose-100", icon: BookOpen },
    { label: "Transit Lines", value: transportRoutes.length, color: "bg-amber-50 text-amber-700 border-amber-100", icon: Truck }
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.parentEmail) return;
    try {
      const generatedRoll = `S2026-${100 + students.length + 1}`;
      await onAddStudent({
        ...newStudent,
        rollNumber: generatedRoll,
        grades: { Mathematics: 85, Science: 80, English: 85, "Social Studies": 80, "Computer Science": 90 }
      });
      setRegSuccess(true);
      setTimeout(() => {
        setRegSuccess(false);
        setShowAddForm(false);
        setNewStudent({
          name: "",
          gender: "Male",
          grade: "10-A",
          rollNumber: "",
          parentName: "",
          parentEmail: "",
          parentPhone: "",
          schoolFeesStatus: { total: 1200, paid: 1200, due: 0, status: "Paid" }
        });
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Administration Console</h2>
          <p className="text-sm text-slate-500">Super Administrator Dashboard & System Security</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {firestoreSyncStatus && (
            <span className="text-xs text-indigo-600 font-mono font-bold animate-pulse">
              ● {firestoreSyncStatus}
            </span>
          )}
          <button
            onClick={handleSyncFirestore}
            disabled={firestoreSyncing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition select-none shadow-xs border border-indigo-650"
          >
            <Database className="w-3.5 h-3.5" />
            {firestoreSyncing ? "Syncing..." : "Backup to Firebase"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`p-4 rounded-xl border bg-white ${stat.color} flex items-center justify-between shadow-xs transition-transform hover:scale-101`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">{stat.label}</p>
                <p className="font-display text-2xl font-bold mt-1 text-slate-800">{stat.value}</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-100">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION NAVIGATOR SELECT DROPDOWN */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl shadow-sm border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 font-mono">Consolidated Directory Navigator</span>
          <h3 className="font-display font-bold text-base text-white">Active System Workspace</h3>
          <p className="text-xs text-slate-300">Select a specialized administrative module to audit and construct records.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono font-medium text-slate-300 whitespace-nowrap hidden sm:inline">Choose Module:</label>
          <div className="relative w-full sm:w-72">
            <select
              value={activeSection}
              onChange={(e) => {
                setActiveSection(e.target.value);
              }}
              className="w-full bg-slate-800 text-white text-xs font-semibold px-4 py-3 pr-10 border border-slate-700 rounded-xl outline-indigo-500 cursor-pointer shadow-sm appearance-none transition-all"
            >
              <option value="exams">🏆 Exams & Scholastic Ledger</option>
              <option value="fees">💳 Tuition & Fees Receivable Hub</option>
              <option value="students_registration">👥 Students Registration & Directory</option>
              <option value="course_registration">📚 Course & Class Session Registration</option>
              <option value="role_access">🛡️ Secure Credentials & Logins</option>
              <option value="faculty_ai">📊 Faculty List & AI Operations Audit</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-400">
              <ListCollapse className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC VIEW WORKSPACE */}
      
      {/* 1. EXAMS & REPORT CARDS */}
      {activeSection === "exams" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Superintendent Scholastic Ledger & Report Registry (Exams)
              </h3>
              <p className="text-xs text-slate-500">Consolidated index of all monthly, midterm, and final term academic achievements across student streams.</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider">
              Consolidated Desk View
            </span>
          </div>

          <ScholasticResultsLedger
            students={students}
            viewMode="full"
          />
        </div>
      )}

      {/* 2. FEES & BILLING */}
      {activeSection === "fees" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-655" />
                Superintendent Student Fees & Accounts Receivable Hub
              </h3>
              <p className="text-xs text-slate-500">Record payments, manage gross tuition billing schedules, and examine active accounts.</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider">
              Finance & Billing Console
            </span>
          </div>

          <SchoolFeesRegistry
            students={students}
            viewMode="admin"
            onPayFees={onPayFees}
            onUpdateFees={onUpdateFees}
          />
        </div>
      )}

      {/* 3. STUDENTS REGISTRATION & ROSTER */}
      {activeSection === "students_registration" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Enroll Student Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-indigo-50 pb-3 mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  Enrollment Registration File
                </h3>
                <p className="text-xs text-slate-500">This adds a student profile securely inside the core administrative catalog.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-1.5 bg-slate-150 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg select-none cursor-pointer transition-colors"
              >
                {showAddForm ? "Collapse Register Form" : "Open Register Form"}
              </button>
            </div>

            {(showAddForm || students.length === 0) && (
              regSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
                  <p className="font-display font-bold">Enrollment Complete!</p>
                  <p className="text-xs">Database has assigned identity roll markers flawlessly.</p>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Liam Sterling"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg outline-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Gender Identification</label>
                    <select
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg outline-indigo-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Grade Stream</label>
                    <select
                      value={newStudent.grade}
                      onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg outline-indigo-500"
                    >
                      <option value="10-A">10-A (Secondary)</option>
                      <option value="9-B">9-B (Basic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Parent/Guardian Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Richard Sterling"
                      value={newStudent.parentName}
                      onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg outline-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Parent Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. richard@sterling.com"
                      value={newStudent.parentEmail}
                      onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg outline-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Parent Mobile Phone</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +1 555 4321"
                      value={newStudent.parentPhone}
                      onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                      className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg outline-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-medium text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm cursor-pointer"
                    >
                      Confirm Registration
                    </button>
                  </div>
                </form>
              )
            )}
          </div>

          {/* Master Roster Directory Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-base">Master Enrolled Students Directory</h4>
                <p className="text-xs text-slate-500">Registry profiles of authorized student bodies and legal parent contacts.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filter name or roll..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="text-xs px-3 py-2 border border-slate-200 rounded-lg outline-indigo-500 w-full sm:w-48"
                />
                <select
                  value={studentGradeFilter}
                  onChange={(e) => setStudentGradeFilter(e.target.value)}
                  className="text-xs px-2.5 py-2 border border-slate-200 rounded-lg outline-indigo-400 cursor-pointer"
                >
                  <option value="All">All Grades</option>
                  <option value="10-A">Grade 10-A</option>
                  <option value="9-B">Grade 9-B</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-4 font-mono">Roll / Student</th>
                    <th className="py-2.5 px-4 font-mono">Gender</th>
                    <th className="py-2.5 px-4 font-mono">Grade Stream</th>
                    <th className="py-2.5 px-4 font-mono">Parent / Guardian</th>
                    <th className="py-2.5 px-4 font-mono">Fees Status</th>
                    <th className="py-2.5 px-4 font-mono">Attendance</th>
                    <th className="py-2.5 px-4 font-mono text-center">Risk Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {students.filter(student => {
                    const matchesSearch = student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                          student.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase());
                    const matchesGrade = studentGradeFilter === "All" || student.grade === studentGradeFilter;
                    return matchesSearch && matchesGrade;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No enrolled student matching query can be found.
                      </td>
                    </tr>
                  ) : (
                    students.filter(student => {
                      const matchesSearch = student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                            student.rollNumber.toLowerCase().includes(studentSearchQuery.toLowerCase());
                      const matchesGrade = studentGradeFilter === "All" || student.grade === studentGradeFilter;
                      return matchesSearch && matchesGrade;
                    }).map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-[10px] text-slate-400 font-mono block">{student.rollNumber}</span>
                          <span className="font-semibold text-slate-900 block">{student.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{student.gender}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded">
                            {student.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block text-xs">{student.parentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{student.parentEmail}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            student.schoolFeesStatus.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : student.schoolFeesStatus.status === "Partial"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}>
                            {student.schoolFeesStatus.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{student.attendanceRate}%</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            student.riskLevel === "Low"
                              ? "bg-emerald-50 text-emerald-700"
                              : student.riskLevel === "Medium"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700 animate-pulse"
                          }`}>
                            {student.riskLevel}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. COURSE REGISTRATION & CLASS TIMESLOTS */}
      {activeSection === "course_registration" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Classroom Course Assignments & Course Registration
                </h3>
                <p className="text-xs text-slate-500">Create new course slots, align class streams with subject topics, and delegate course sessions to faculty.</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider">
                Active Stream Register
              </span>
            </div>

            {/* AI TIMETABLE GENERATION CARDS PANEL */}
            <div className="bg-[#EEF2F6] rounded-2xl border border-slate-200/80 p-5 space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    Gemini AI Academic Timetable Generator
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal">
                    Auto-construct optimized, clash-free academic calendars. Generates conflict-free class rosters and shares them instantly with teacher, student, and principal portals.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3.5 sm:self-start xl:self-center">
                  <div className="flex flex-col gap-1 w-36">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Stream Target</span>
                    <select
                      value={aiGenGrade}
                      onChange={(e) => setAiGenGrade(e.target.value)}
                      className="text-xs px-2.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-indigo-550 font-semibold text-slate-700"
                    >
                      <option value="All">All Class Streams</option>
                      <option value="10-A">Class 10-A Only</option>
                      <option value="9-B">Class 9-B Only</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1 w-44">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Conflict Strategy</span>
                    <select
                      value={aiGenPolicy}
                      onChange={(e) => setAiGenPolicy(e.target.value as any)}
                      className="text-xs px-2.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-indigo-550 font-semibold text-slate-700"
                    >
                      <option value="replace">Overwrite Existing School Schedule</option>
                      <option value="append">Append New Lessons</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAIGenerateTimetable}
                    disabled={aiGenLoading}
                    className="self-end flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
                  >
                    {aiGenLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        AI Mapping Scheduler...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-305" />
                        Assemble Schedule
                      </>
                    )}
                  </button>
                </div>
              </div>

              {aiGenStatus && (
                <div className="p-3.5 bg-white border border-indigo-100 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-800">
                      {aiGenStatus.msg} <span className="p-1 px-2.5 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[9px] text-indigo-700 font-bold ml-1.5 uppercase font-mono">{aiGenStatus.mode === "cognitive" ? "Gemini AI Live" : "Local Engine"}</span>
                    </span>
                  </div>
                  <button type="button" onClick={() => setAiGenStatus(null)} className="text-slate-400 hover:text-slate-600 font-bold font-sans block px-2 cursor-pointer">✕</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Course Assignment Registration Form */}
              <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200/80">
                <h4 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider mb-4 font-mono text-slate-600">
                  Register New Course Stream
                </h4>
                <form onSubmit={handleCourseRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Grade Stream</label>
                    <select
                      value={newCourse.grade}
                      onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 cursor-pointer"
                    >
                      <option value="10-A">10-A (Secondary)</option>
                      <option value="9-B">9-B (Basic)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Day of Class</label>
                    <select
                      value={newCourse.day}
                      onChange={(e) => setNewCourse({ ...newCourse, day: e.target.value as any })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 cursor-pointer"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Subject Course</label>
                    <select
                      value={newCourse.subject}
                      onChange={(e) => setNewCourse({ ...newCourse, subject: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 cursor-pointer"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="Social Studies">Social Studies</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Assign Teacher</label>
                    <select
                      value={newCourse.teacher}
                      onChange={(e) => setNewCourse({ ...newCourse, teacher: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 cursor-pointer"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.subject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Daily Time Slot</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 08:30 AM - 09:30 AM"
                      value={newCourse.timeSlot}
                      onChange={(e) => setNewCourse({ ...newCourse, timeSlot: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-1">Assigned Room</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Room 101"
                      value={newCourse.room}
                      onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer text-center uppercase tracking-wider"
                  >
                    Register Course Session
                  </button>
                </form>
              </div>

              {/* Course Assignments List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Assigned Course Timetables</p>
                    <p className="text-[10px] text-slate-400">Total registered sections: {timetable.length}</p>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-bold">
                    Live Stream Map
                  </span>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="py-2.5 px-4 font-mono">Grade Stream</th>
                          <th className="py-2.5 px-4 font-mono">Course/Subject</th>
                          <th className="py-2.5 px-4 font-mono">Assigned Educator</th>
                          <th className="py-2.5 px-4 font-mono">Timing / Day</th>
                          <th className="py-2.5 px-4 font-mono">Room</th>
                          <th className="py-2.5 px-4 font-mono text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {timetable.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No course registrations exist. Please use the registration form to schedule a class session.
                            </td>
                          </tr>
                        ) : (
                          timetable.map((tt) => (
                            <tr key={tt.id} className="hover:bg-slate-50/40">
                              <td className="py-3 px-4 font-bold text-slate-800">{tt.grade}</td>
                              <td className="py-3 px-4 font-semibold text-indigo-700">{tt.subject}</td>
                              <td className="py-3 px-4 text-slate-700">{tt.teacher}</td>
                              <td className="py-3 px-4">
                                <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-medium mr-1.5 font-sans">
                                  {tt.day}
                                </span>
                                <span className="text-slate-500 font-mono">{tt.timeSlot}</span>
                              </td>
                              <td className="py-3 px-4 font-mono font-medium text-slate-600">{tt.room}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => onDeleteTimetableEntry(tt.id)}
                                  className="p-1 px-2 text-rose-600 hover:bg-rose-50 border border-transparent rounded hover:border-rose-100 transition-colors cursor-pointer text-[10px] font-bold"
                                  title="Unregister course session"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SECURE CREDENTIAL DISPATCH & ROLE ACCESS REGISTRY */}
      {activeSection === "role_access" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600 animate-pulse" />
                Secure Login Assignment Console
              </h3>
              <p className="text-xs text-slate-500">Assign authorized system usernames and access credentials for teachers, students, & parents.</p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
              Super Admin Clearance
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assignment Form Card */}
            <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200/60 flex flex-col justify-between">
              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono">1. Select Destination Role</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(["teacher", "student", "parent"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setAssignUserType(role);
                          setAssignTargetId(""); // Reset to first automatically
                        }}
                        className={`px-2 py-2 text-xs font-bold rounded-lg text-center cursor-pointer capitalize border transition-all ${
                          assignUserType === role
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono">2. Select Target Individual</span>
                  <select
                    value={assignTargetId}
                    onChange={(e) => setAssignTargetId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="">-- Choose User --</option>
                    {assignUserType === "teacher" &&
                      teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subject})
                        </option>
                      ))}
                    {assignUserType === "student" &&
                      students.map((s) => (
                        <option key={s.id} value={s.id}>
                          [Roll {s.rollNumber}] {s.name} (Grade {s.grade})
                        </option>
                      ))}
                    {assignUserType === "parent" &&
                      students.map((s) => (
                        <option key={s.id} value={s.id}>
                          [Parent of {s.name}] {s.parentName} ({s.parentEmail})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono">3. Assigned Username</span>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. jjenkins"
                        value={assignUsername}
                        onChange={(e) => setAssignUsername(e.target.value.toLowerCase().trim())}
                        className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 font-mono"
                      />
                      <span className="absolute right-2.5 top-2 bg-slate-100 text-[9px] font-bold text-slate-500 px-1.5 py-0.5 rounded uppercase font-mono">Suggest</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono">4. Entry Password</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        placeholder="e.g. G4R6Y7UX"
                        value={assignPassword}
                        onChange={(e) => setAssignPassword(e.target.value)}
                        className="flex-1 text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-lg outline-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setAssignPassword(Math.random().toString(36).substring(2, 10).toUpperCase())}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 cursor-pointer"
                        title="Regenerate secure password code"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {loginMsg && (
                  <div className={`p-3 rounded-lg flex items-start gap-2 text-xs border ${
                    loginMsg.isError 
                      ? "bg-rose-50 border-rose-100 text-rose-800" 
                      : "bg-emerald-50 border-emerald-100 text-emerald-800"
                  }`}>
                    {loginMsg.isError ? <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                    <span>{loginMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer tracking-wider uppercase flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  Assign & Dispatch Credentials
                </button>
              </form>
            </div>

            {/* Assigned Credentials Table/List Registry Area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Assigned Logins Database Registry</p>
                  <p className="text-[10px] text-slate-400">Total authorized session identities available in system</p>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-bold">
                  {logins.length} Active Profiles
                </span>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="py-2.5 px-4 font-mono">User / Category</th>
                        <th className="py-2.5 px-4 font-mono">System Username</th>
                        <th className="py-2.5 px-4 font-mono">Password Key</th>
                        <th className="py-2.5 px-4 font-mono">Security Status</th>
                        <th className="py-2.5 px-4 font-mono text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {logins.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            <AlertCircle className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                            No logins have been assigned yet. Select a role key to begin authorization.
                          </td>
                        </tr>
                      ) : (
                        logins.map((login) => {
                          const isTeacher = login.userType === "teacher";
                          const isStudent = login.userType === "student";
                          return (
                            <tr key={login.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1 rounded-md text-[10px] font-bold select-none ${
                                    isTeacher 
                                      ? "bg-teal-50 text-teal-700 border border-teal-100" 
                                      : isStudent 
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                                        : "bg-rose-50 text-rose-700 border border-rose-100"
                                  }`}>
                                    {login.userType.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{login.targetName}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">ID: {login.targetId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono font-medium text-slate-700">
                                {login.username}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-600 font-semibold tracking-wide">
                                {login.password || "••••••••"}
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  onClick={() => onToggleLoginStatus(login.id)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border transition-colors cursor-pointer ${
                                    login.status === "Active"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-[#DCFCE7]"
                                      : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-[#FEE2E2]"
                                  }`}
                                >
                                  {login.status}
                                </button>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 animate-in fade-in duration-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssignUserType(login.userType);
                                      setAssignTargetId(login.targetId);
                                      setAssignUsername(login.username);
                                      setAssignPassword(login.password || "");
                                    }}
                                    className="p-1 px-2 text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded hover:border-indigo-100 transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-0.5"
                                    title="Edit credentials and mapping username"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await onDeleteLogin(login.id);
                                      // Log deletion
                                      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                                      const traceAction = {
                                        id: Date.now(),
                                        action: "Credential Revocation",
                                        details: `Revoked entry logins for ${login.targetName} (${login.userType})`,
                                        model: "Identity Proxy",
                                        time: timeStr
                                      };
                                      setLogs(prev => [traceAction, ...prev]);
                                    }}
                                    className="p-1 px-1.5 text-rose-600 hover:bg-rose-50 border border-transparent rounded hover:border-rose-100 transition-colors cursor-pointer text-[10px] font-bold"
                                    title="Revoke and delete login key"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. FACULTY & AI STATS MONITOR */}
      {activeSection === "faculty_ai" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Faculty Roster */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Faculty Roster
                </h3>
                <p className="text-xs text-slate-500">Subject expertise and allocated class pathways</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-medium">
                Ready
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <div key={t.id} className="py-3 flex sm:items-center justify-between flex-col sm:flex-row gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{t.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{t.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-800 rounded-md">
                      {t.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {t.assignedGrades.map((g, gi) => (
                        <span key={gi} className="text-[10px] bg-sky-50 text-sky-800 border border-sky-100 px-1.5 py-0.5 rounded-sm">
                          Class {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Operations Monitor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Activity Audit
              </h3>
              <p className="text-xs text-slate-500">Secure real-time tracing of LLM models on the server</p>
            </div>

            <div className="space-y-3 flex-1">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px] border-t border-slate-200/50 pt-1 text-slate-400">
                    <span className="font-mono">Engine: {log.model}</span>
                    <span className="bg-emerald-100/75 text-emerald-800 px-1 py-0.5 rounded-xs">Secure</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 justify-between font-mono">
              <span>Server Proxy Port: 3000</span>
              <span className="text-emerald-500 font-bold">&#x25CF; Operational</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
