/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Shield, Key, Lock, Eye, EyeOff, AlertCircle, HelpCircle, CheckCircle2 } from "lucide-react";
import { Student, Teacher, LoginCredential } from "../types";

interface RoleLoginProps {
  role: "teacher" | "student" | "parent";
  students: Student[];
  teachers: Teacher[];
  logins: LoginCredential[];
  onVerifySuccess: (targetId: string) => void;
}

export default function RoleLogin({
  role,
  students,
  teachers,
  logins,
  onVerifySuccess
}: RoleLoginProps) {
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize selected target whenever role or list changes
  useEffect(() => {
    setError(null);
    setPassword("");
    if (role === "teacher" && teachers.length > 0) {
      setSelectedId(teachers[0].id);
    } else if ((role === "student" || role === "parent") && students.length > 0) {
      setSelectedId(students[0].id);
    } else {
      setSelectedId("");
    }
  }, [role, teachers, students]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedId) {
      setError("Please select a profile from the dropdown.");
      return;
    }

    setLoading(true);

    // Simulated short verification delay for premium feel
    setTimeout(() => {
      setLoading(false);
      
      const credential = logins.find(
        (l) => l.userType === role && l.targetId === selectedId
      );

      if (!credential) {
        setError(
          `No active credential assigned. Please sign into the "Super Admin" account first and assign login credentials to this individual.`
        );
        return;
      }

      if (credential.status === "Blocked") {
        setError(
          `This identity has been BLOCKED by the Super Admin. Please contact system support for reinstatement.`
        );
        return;
      }

      if (credential.password !== password) {
        setError(
          `Invalid security password entered. Credentials are case-sensitive and must be provided by the Super Admin.`
        );
        return;
      }

      // Success sequence
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPassword("");
        onVerifySuccess(selectedId);
      }, 800);
    }, 450);
  };

  const getTargetName = () => {
    if (role === "teacher") {
      const t = teachers.find((tc) => tc.id === selectedId);
      return t ? t.name : "Educator";
    } else {
      const s = students.find((std) => std.id === selectedId);
      if (role === "student") return s ? s.name : "Student";
      return s ? `${s.parentName} (${s.name}'s Guardian)` : "Parent";
    }
  };

  const roleLabels = {
    teacher: { title: "Educator Portal Lock", subtitle: "Verify qualifications & entry tokens to access gradebooks", badge: "Educator Level" },
    student: { title: "Student Arena Authorization", subtitle: "Access your lessons, AI Prep worksheets, & tutoring history", badge: "Academic Class" },
    parent: { title: "Parent advisory Link Gate", subtitle: "Secure verification for child transcripts, ledgers & transcripts", badge: "Family Guardian" }
  };

  const activeMeta = roleLabels[role];

  return (
    <div className="flex items-center justify-center py-10 px-4 min-h-[70vh]">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden transition-all duration-300">
        
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-50 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

        <div className="relative space-y-6">
          
          {/* Lock Icon and Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs relative">
              <Shield className={`w-7 h-7 ${loading ? "animate-pulse" : ""}`} />
              <div className="absolute -bottom-1 -right-1 bg-violet-600 text-white p-1 rounded-md">
                <Lock className="w-3 h-3" />
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-bold tracking-wider font-mono uppercase inline-block">
                {activeMeta.badge}
              </span>
              <h2 className="text-xl font-display font-black text-slate-900 tracking-tight">
                {activeMeta.title}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                {activeMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Step 1: Dropdown selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 font-mono tracking-wider uppercase">
                1. Select Identity Profile
              </label>
              <select
                required
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setError(null);
                }}
                className="w-full text-xs px-3.5 py-3 border border-slate-200 bg-white rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-800 transition-all cursor-pointer"
              >
                {role === "teacher" && (
                  <>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.subject}
                      </option>
                    ))}
                  </>
                )}
                {role === "student" && (
                  <>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Roll: {s.rollNumber}, Class {s.grade})
                      </option>
                    ))}
                  </>
                )}
                {role === "parent" && (
                  <>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.parentName} (Parent of {s.name})
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Step 2: Password input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-600 font-mono tracking-wider uppercase">
                  2. Entry Verification Key
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Provided by Super Admin</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full text-xs px-3.5 py-3 border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono text-slate-800 tracking-widest leading-none bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-md"
                  title={showPassword ? "Hide password" : "Reveal password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Interactive Feedback Errors */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-[11px] text-red-800 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="leading-relaxed font-semibold">{error}</span>
              </div>
            )}

            {/* Button submission */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-80"
            >
              {success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Clearance Granted!
                </>
              ) : loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validating Core Keys...
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5 text-indigo-200" />
                  Grant Secure Entry
                </>
              )}
            </button>
          </form>

          {/* Quick info advisory */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3 text-[11px] text-slate-500 leading-relaxed font-medium">
            <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-slate-700">Need credentials?</p>
              <p>The security logins are managed under the <strong className="text-indigo-600">Super Admin Dashboard</strong>. By default, preloaded logins have password <strong>Password123</strong>.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
