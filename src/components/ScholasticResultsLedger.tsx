/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Award, 
  Search, 
  Filter, 
  BookOpen, 
  TrendingUp, 
  Download, 
  User, 
  Calendar,
  AlertCircle,
  HelpCircle,
  GraduationCap
} from "lucide-react";
import { Student } from "../types";

interface ScholasticResultsLedgerProps {
  students: Student[];
  teacherSubject?: string; // Optional: Scope to specific teacher subject
  assignedGrades?: string[]; // Optional: Scope to specific classes
  singleStudentId?: string; // Optional: Scope to single student (Student/Parent view)
  viewMode?: "full" | "individual";
}

export default function ScholasticResultsLedger({
  students,
  teacherSubject,
  assignedGrades,
  singleStudentId,
  viewMode = "full"
}: ScholasticResultsLedgerProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Monthly" | "Midterm" | "Final Term">("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedClass, setSelectedClass] = useState<string>("All");

  // Flat list of all academic results decorated with student context
  const allResults = useMemo(() => {
    const list: any[] = [];
    students.forEach((student) => {
      // If single student view, check id
      if (singleStudentId && student.id !== singleStudentId) {
        return;
      }
      
      // If teacher grades scope, filter student classes
      if (assignedGrades && assignedGrades.length > 0 && !assignedGrades.includes(student.grade)) {
        return;
      }

      if (student.academicResults) {
        student.academicResults.forEach((res) => {
          // If teacher is scoping to their subject
          if (teacherSubject && res.subject !== teacherSubject) {
            return;
          }

          list.push({
            resultId: res.id,
            studentId: student.id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            studentGrade: student.grade,
            category: res.category,
            periodName: res.periodName,
            subject: res.subject,
            score: res.score,
            maxMarks: res.maxMarks,
            remarks: res.remarks,
            loggedAt: res.loggedAt
          });
        });
      }
    });

    // Sort by loggedAt descending
    return list.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
  }, [students, teacherSubject, assignedGrades, singleStudentId]);

  // Filtered academic results
  const filteredResults = useMemo(() => {
    return allResults.filter((r) => {
      const matchesSearch = searchQuery === "" || 
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
      const matchesMonth = selectedMonth === "All" || r.periodName === selectedMonth;
      const matchesSubject = selectedSubject === "All" || r.subject === selectedSubject;
      const matchesClass = selectedClass === "All" || r.studentGrade === selectedClass;

      return matchesSearch && matchesCategory && matchesMonth && matchesSubject && matchesClass;
    });
  }, [allResults, searchQuery, selectedCategory, selectedMonth, selectedSubject, selectedClass]);

  // Calculate stats based on filtered list
  const stats = useMemo(() => {
    if (filteredResults.length === 0) return { avg: 0, passRate: 0, high: 0, low: 0, total: 0 };
    const scores = filteredResults.map((r) => r.score);
    const total = scores.reduce((acc, s) => acc + s, 0);
    const avg = Math.round(total / scores.length);
    const passCount = filteredResults.filter((r) => r.score >= 50).length;
    const passRate = Math.round((passCount / filteredResults.length) * 100);
    const high = Math.max(...scores);
    const low = Math.min(...scores);
    return { avg, passRate, high, low, total: filteredResults.length };
  }, [filteredResults]);

  // Helper to get grade badge and colors
  const getGradeMeta = (score: number) => {
    if (score >= 90) return { label: "A+", bg: "bg-emerald-50 text-emerald-800 border-emerald-200/50" };
    if (score >= 80) return { label: "A", bg: "bg-teal-50 text-teal-800 border-teal-200/50" };
    if (score >= 70) return { label: "B", bg: "bg-cyan-50 text-cyan-800 border-cyan-200/50" };
    if (score >= 60) return { label: "C", bg: "bg-amber-50 text-amber-800 border-amber-200/50" };
    if (score >= 50) return { label: "D", bg: "bg-orange-50 text-orange-850 border-orange-200/50" };
    return { label: "F", bg: "bg-rose-50 text-rose-800 border-rose-200" };
  };

  // Get unique class list for filter dropdown
  const classes = useMemo(() => {
    const list = new Set<string>();
    students.forEach((s) => list.add(s.grade));
    return Array.from(list).sort();
  }, [students]);

  // Months lists
  const availableMonths = ["January", "February", "March", "April", "May", "June"];

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block mb-1">Average Score</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-950 font-mono">{stats.avg}%</span>
            <span className="text-xs text-indigo-600 font-medium">overall avg</span>
          </div>
          <div className="absolute top-3 right-3 p-1.5 bg-indigo-600/10 rounded-xl text-indigo-700">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block mb-1">Passing Integrity</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-950 font-mono">{stats.passRate}%</span>
            <span className="text-xs text-emerald-700 font-medium">&ge;50 marks pass</span>
          </div>
          <div className="absolute top-3 right-3 p-1.5 bg-emerald-600/10 rounded-xl text-emerald-700">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-100 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block mb-1">High Peak Grade</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-sky-950 font-mono">{stats.high}%</span>
            <span className="text-xs text-sky-700 font-medium">record top</span>
          </div>
          <div className="absolute top-3 right-3 p-1.5 bg-sky-600/10 rounded-xl text-sky-700">
            <BookOpen className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Total Record Count</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">logged exams</span>
          </div>
          <div className="absolute top-3 right-3 p-1.5 bg-slate-600/15 rounded-xl text-slate-700">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 2. Advanced Filters Dock */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-650" />
              Academic Results Filter Registry
            </h3>
            <p className="text-xs text-slate-500">Categorize, search, and analyze month wise, midterm, or final term outcomes</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5">
            <button 
              onClick={() => {
                setSelectedCategory("All");
                setSelectedMonth("All");
                setSelectedSubject("All");
                setSelectedClass("All");
                setSearchQuery("");
              }}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Term Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assessment Term</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as any);
                if (e.target.value !== "Monthly") setSelectedMonth("All");
              }}
              className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option value="All">All Achievements</option>
              <option value="Monthly">Monthly Test (Month Wise)</option>
              <option value="Midterm">Midterm Examination</option>
              <option value="Final Term">Final Term Examination</option>
            </select>
          </div>

          {/* Month Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month Selection</label>
            <select
              disabled={selectedCategory !== "Monthly" && selectedCategory !== "All"}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700 disabled:opacity-50"
            >
              <option value="All">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Subject</label>
            <select
              disabled={!!teacherSubject}
              value={!!teacherSubject ? teacherSubject : selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
            >
              <option value="All">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Social Studies">Social Studies</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          </div>

          {/* Class Filter */}
          {viewMode === "full" ? (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-xl shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700"
              >
                <option value="All">All Classes</option>
                {classes.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reporting Mode</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                Single Student
              </div>
            </div>
          )}

          {/* Text/Search Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Profile</label>
            <div className="relative">
              <input
                disabled={viewMode !== "full"}
                type="text"
                placeholder={viewMode === "full" ? "Name or roll code..." : "Locked individual"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl shadow-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700 disabled:opacity-50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. DataTable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] uppercase font-bold text-slate-500">
              <tr>
                {viewMode === "full" && <th className="p-4">Student Name</th>}
                <th className="p-4">Subject Course</th>
                <th className="p-4">Exam Term Category</th>
                <th className="p-4">Schedule Period</th>
                <th className="p-4 text-center">Achieved Score</th>
                <th className="p-4 text-center">Grade Letter</th>
                <th className="p-4">Assessor Feedback Remarks</th>
                <th className="p-4 text-right">Logged At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === "full" ? 8 : 7} className="p-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700">No Scholastic Records Found</p>
                      <p className="text-xs text-slate-500">No grading achievements match the chosen query parameters or filters. Try resetting the criteria filters above.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => {
                  const gradeMeta = getGradeMeta(r.score);
                  return (
                    <tr key={r.resultId} className="hover:bg-slate-50/50 transition-colors">
                      {viewMode === "full" && (
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center font-bold text-indigo-700 text-[10px] font-mono shrink-0">
                              {r.studentName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{r.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{r.rollNumber} • Class {r.studentGrade}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="p-4 font-bold text-indigo-950">
                        {r.subject}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          r.category === "Final Term" ? "bg-amber-50 text-amber-800 border-amber-200" :
                          r.category === "Midterm" ? "bg-purple-50 text-purple-800 border-purple-200" :
                          "bg-blue-50 text-blue-800 border-blue-200"
                        }`}>
                          {r.category}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 font-mono">
                        {r.periodName}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-900 font-mono">
                        {r.score} <span className="text-slate-400 font-normal">/ {r.maxMarks}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${gradeMeta.bg}`}>
                          {gradeMeta.label}
                        </span>
                      </td>
                      <td className="p-4 italic text-slate-500 font-medium">
                        "{r.remarks || "No remarks annotated"}"
                      </td>
                      <td className="p-4 text-right font-mono text-[10px] text-slate-400">
                        {new Date(r.loggedAt).toLocaleDateString()}
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
  );
}
