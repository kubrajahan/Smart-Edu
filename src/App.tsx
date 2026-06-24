/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import PrincipalDashboard from "./components/PrincipalDashboard";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import ParentDashboard from "./components/ParentDashboard";
import AIChatBot from "./components/AIChatBot";
import RoleLogin from "./components/RoleLogin";
import { Student, Teacher, LibraryBook, TransportRoute, TimetableEntry, LessonPlan, GeneratedExam, LoginCredential, Course, SchoolClass } from "./types";
import { 
  Loader2, 
  School, 
  ShieldAlert, 
  GraduationCap, 
  Users, 
  HeartHandshake, 
  Sparkles, 
  Search, 
  Menu, 
  X,
  Database
} from "lucide-react";

export default function App() {
  const [currentRole, setCurrentRole] = useState<"super_admin" | "principal" | "teacher" | "student" | "parent">("super_admin");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core School Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [transportRoutes, setTransportRoutes] = useState<TransportRoute[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [generatedExams, setGeneratedExams] = useState<GeneratedExam[]>([]);
  const [logins, setLogins] = useState<LoginCredential[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  // Password-protected session authentications
  const [teacherAuthId, setTeacherAuthId] = useState<string | null>(null);
  const [studentAuthId, setStudentAuthId] = useState<string | null>(null);
  const [parentAuthId, setParentAuthId] = useState<string | null>(null);

  // Synchronize school database from backend Express REST routes
  const syncDatabase = async () => {
    try {
      const res = await fetch("/api/school/db");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setTeachers(data.teachers);
        setLibraryBooks(data.libraryBooks);
        setTransportRoutes(data.transportRoutes);
        setTimetable(data.timetable);
        setLessonPlans(data.lessonPlans);
        setGeneratedExams(data.generatedExams);
        setLogins(data.logins || []);
        setCourses(data.courses || []);
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error("Failed to sync client state from school database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncDatabase();
  }, []);

  // Post Actions
  const handleAssignLogin = async (loginData: any) => {
    try {
      const res = await fetch("/api/school/login/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Assigning login failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLoginStatus = async (loginId: string) => {
    try {
      const res = await fetch("/api/school/login/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId }),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Toggling login status failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLogin = async (loginId: string) => {
    try {
      const res = await fetch("/api/school/login/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId }),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Deleting login failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudent = async (studentData: any) => {
    try {
      const res = await fetch("/api/school/student/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Enrollment transaction failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAttendance = async (studentId: string, date: string, status: "Present" | "Absent" | "Excused") => {
    try {
      const res = await fetch("/api/school/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, date, status }),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Attendance log transaction failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogGrade = async (
    studentId: string,
    subject: string,
    score: number,
    category?: "Monthly" | "Midterm" | "Final Term",
    periodName?: string,
    remarks?: string
  ) => {
    try {
      const res = await fetch("/api/school/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, subject, score, category, periodName, remarks }),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Grade registration transaction failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayFees = async (studentId: string, amount: number, method: string, remarks?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/school/fees/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, amount, method, remarks }),
      });
      if (res.ok) {
        await syncDatabase();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateFees = async (studentId: string, total: number, status?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/school/fees/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, total, status }),
      });
      if (res.ok) {
        await syncDatabase();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleAddTimetableEntry = async (entry: any) => {
    try {
      const res = await fetch("/api/school/timetable/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Registering course timetable failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTimetableEntry = async (id: string) => {
    try {
      const res = await fetch("/api/school/timetable/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Deleting course timetable entry failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignClassTeacher = async (teacherId: string, grade: string) => {
    try {
      const res = await fetch("/api/school/teacher/assign-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, grade }),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Assigning class teacher failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCourse = async (courseData: any) => {
    try {
      const res = await fetch("/api/school/course/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Add course failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddClass = async (classData: any) => {
    try {
      const res = await fetch("/api/school/class/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData),
      });
      if (res.ok) {
        await syncDatabase();
      } else {
        throw new Error("Add class failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Role Dashboard
  const renderDashboard = () => {
    switch (currentRole) {
      case "super_admin":
        return (
          <SuperAdminDashboard
            students={students}
            teachers={teachers}
            libraryBooks={libraryBooks}
            transportRoutes={transportRoutes}
            timetable={timetable}
            onAddStudent={handleAddStudent}
            onAddTimetableEntry={handleAddTimetableEntry}
            onDeleteTimetableEntry={handleDeleteTimetableEntry}
            logins={logins}
            onAssignLogin={handleAssignLogin}
            onToggleLoginStatus={handleToggleLoginStatus}
            onDeleteLogin={handleDeleteLogin}
            onPayFees={handlePayFees}
            onUpdateFees={handleUpdateFees}
            onSyncDatabase={syncDatabase}
            onAssignClassTeacher={handleAssignClassTeacher}
            courses={courses}
            classes={classes}
            onAddCourse={handleAddCourse}
            onAddClass={handleAddClass}
          />
        );
      case "principal":
        return (
          <PrincipalDashboard
            students={students}
            teachers={teachers}
            libraryBooks={libraryBooks}
            timetable={timetable}
            onPayFees={handlePayFees}
          />
        );
      case "teacher":
        if (!teacherAuthId) {
          return (
            <RoleLogin
              role="teacher"
              students={students}
              teachers={teachers}
              logins={logins}
              onVerifySuccess={(id) => setTeacherAuthId(id)}
            />
          );
        }
        return (
          <TeacherDashboard
            students={students}
            teachers={teachers}
            timetable={timetable}
            lessonPlans={lessonPlans}
            generatedExams={generatedExams}
            onUpdateAttendance={handleUpdateAttendance}
            onLogGrade={handleLogGrade}
            loggedInTeacherId={teacherAuthId}
            onLogout={() => setTeacherAuthId(null)}
            courses={courses}
            classes={classes}
          />
        );
      case "student":
        if (!studentAuthId) {
          return (
            <RoleLogin
              role="student"
              students={students}
              teachers={teachers}
              logins={logins}
              onVerifySuccess={(id) => setStudentAuthId(id)}
            />
          );
        }
        return (
          <StudentDashboard
            students={students}
            timetable={timetable}
            loggedInStudentId={studentAuthId}
            onLogout={() => setStudentAuthId(null)}
          />
        );
      case "parent":
        if (!parentAuthId) {
          return (
            <RoleLogin
              role="parent"
              students={students}
              teachers={teachers}
              logins={logins}
              onVerifySuccess={(id) => setParentAuthId(id)}
            />
          );
        }
        return (
          <ParentDashboard
            students={students}
            loggedInStudentId={parentAuthId}
            onLogout={() => setParentAuthId(null)}
            onPayFees={handlePayFees}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">Selected Perspective Role is not available.</p>
          </div>
        );
    }
  };

  const roleMeta = {
    super_admin: { label: "Super Admin Console", desc: "System identity registries & AI activity tracer", icon: ShieldAlert, color: "text-red-400" },
    principal: { label: "Principal Executive Desk", desc: "Scholastic compliance & strategic counsel plan", icon: School, color: "text-amber-400" },
    teacher: { label: "Educator Workspace Planner", desc: "Interactive attendance, gradebooks, & content synthesis", icon: GraduationCap, color: "text-emerald-400" },
    student: { label: "Student Learning Arena", desc: "Grade performance profiles & personal AI tutor chat", icon: Users, color: "text-indigo-400" },
    parent: { label: "Parent Advisory Link", desc: "Real-time grades, ledgers, & AI multilingual communications", icon: HeartHandshake, color: "text-rose-400" }
  };

  const activeMeta = roleMeta[currentRole];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="font-display font-bold text-slate-900 text-sm">Synchronizing SmartEdu Database</p>
        <p className="text-xs text-slate-400">Loading scholastic records, AI assets, and role systems...</p>
      </div>
    );
  }

  // Sidebar components
  const navigationItems = [
    { id: "super_admin", label: "Super Admin", icon: ShieldAlert, desc: "Database & Security Log" },
    { id: "principal", label: "Principal Desk", icon: School, desc: "Executive Insights" },
    { id: "teacher", label: "Teacher Suite", icon: GraduationCap, desc: "Grade & AI Planners" },
    { id: "student", label: "Student Portal", icon: Users, desc: "AI Prep & Timetable" },
    { id: "parent", label: "Parent Link", icon: HeartHandshake, desc: "Fees Ledger & Reports" }
  ] as const;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] font-sans text-slate-950 overflow-hidden">
      
      {/* Sidebar - Desktop Only */}
      <aside className="w-64 bg-[#0F172A] shrink-0 text-slate-300 hidden md:flex flex-col h-screen select-none border-r border-slate-800">
        
        {/* Sidebar Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/60">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-900/30">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-tight text-white leading-none">SmartEdu AI</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold leading-none">Intelligent Portal</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 mt-6 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 font-mono">Role Perspective</p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRole === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-btn-${item.id}`}
                onClick={() => setCurrentRole(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20 font-semibold scale-[1.01]" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors duration-150 ${
                  isActive ? "bg-indigo-500/30 text-white" : "bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm block">{item.label}</span>
                  <span className={`text-[9px] block font-normal leading-none mt-0.5 ${isActive ? "text-indigo-200" : "text-slate-500 group-hover:text-slate-400"}`}>{item.desc}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom AI Agent Tracker Widget */}
        <div className="p-4 border-t border-slate-800/60">
          <div className="bg-slate-850/70 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Studio status</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-xs text-emerald-400 font-semibold tracking-wide font-mono">Gemini 3.5 Flash connected</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        
        {/* Dynamic Desktop/Mobile Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          
          {/* Left Side: Dynamic Workspace Information Context */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 px-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 md:hidden cursor-pointer shrink-0"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-3">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <activeMeta.icon className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
                  {activeMeta.label} 
                </h2>
                <p className="text-[11px] text-slate-500 font-normal leading-none mt-0.5">{activeMeta.desc}</p>
              </div>
            </div>

            <div className="sm:hidden">
              <h2 className="text-sm font-bold text-slate-900 leading-none">{activeMeta.label}</h2>
              <p className="text-[10px] text-slate-400 leading-none mt-1">Spring Semester 2026</p>
            </div>
          </div>

          {/* Right Side: Search and Executive Profile indicator */}
          <div className="flex items-center gap-4">
            
            {/* Quick Informative Pill */}
            <div className="hidden lg:flex items-center bg-[#F1F5F9] px-3.5 py-1.5 rounded-full border border-[#E2E8F0] text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
              <span className="text-slate-500 font-medium">Academic Context:</span>
              <span className="text-slate-900 font-bold ml-1 font-mono">Spring Semester 2026</span>
            </div>

            {/* Simulated Live User Profile Indicator */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 capitalize">{currentRole.replace("_", " ")}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider font-mono">AUTHORIZED SESSION</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-50 shadow-inner">
                {currentRole.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Main Fluid Scrollable Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Interactive Notice alert linking to Gemini capability */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-700">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-500/40 border border-white/20 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">Intel Active</span>
                  <p className="text-xs text-white/90 font-bold font-mono">Cognitive Learning Model Synced</p>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Unified Academic Management</h3>
                <p className="text-xs text-indigo-100 max-w-2xl leading-relaxed">
                  SmartEdu AI utilizes full-stack database triggers and Gemini 3.5 Flash to automatically compose lesson plans, construct targeted exams, recommend absentee warnings, and translate reports on the fly.
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-full border border-white/10 shrink-0 self-center hidden lg:block">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Core Dashboard UI Container */}
            <div className="w-full">
              {renderDashboard()}
            </div>
          </div>
        </main>

        {/* Micro-footer */}
        <footer className="h-10 border-t border-slate-200 bg-white py-2 px-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-mono shrink-0 gap-1 select-none">
          <span>&copy; 2026 SmartEdu AI. Modern Cognitive System.</span>
          <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Persistent Port: 3000 &bull; Secure DB Connected
          </span>
        </footer>
      </div>

      {/* Floating Interactive 24/7 School AI Desk assistant */}
      <AIChatBot />

      {/* Interactive Mobile Slide-out Drawer Navigation Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-xs select-none animate-in fade-in duration-150">
          
          {/* Drawer Paper */}
          <div className="w-[280px] bg-[#0F172A] p-6 h-full flex flex-col slide-in-from-left duration-200">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <School className="w-4 h-4" />
                </div>
                <span className="text-white font-bold text-base font-display">SmartEdu Workspace</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 border border-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                title="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile links */}
            <nav className="flex-1 space-y-2 mt-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 mb-2 font-mono">Role Switcher</p>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRole === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentRole(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-indigo-600 text-white font-semibold" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="text-sm block">{item.label}</span>
                      <span className="text-[9px] block text-slate-400 font-normal mt-0.5 leading-none">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Mobile Bottom status block */}
            <div className="mt-auto border-t border-slate-800/60 pt-4">
              <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 text-[11px] font-mono">
                <p className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> AI CLOUD DISPATCH
                </p>
                <p className="text-emerald-400">Connected successfully</p>
              </div>
            </div>
          </div>

          {/* Tap-outside to close */}
          <div className="flex-grow" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

    </div>
  );
}
