/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { School, ShieldAlert, GraduationCap, Users, User, HeartHandshake } from "lucide-react";

interface HeaderProps {
  currentRole: "super_admin" | "principal" | "teacher" | "student" | "parent";
  onRoleChange: (role: "super_admin" | "principal" | "teacher" | "student" | "parent") => void;
  isLoading: boolean;
}

export default function Header({ currentRole, onRoleChange, isLoading }: HeaderProps) {
  const roles = [
    { id: "super_admin", label: "Super Admin", icon: ShieldAlert, color: "text-red-600 bg-red-50 hover:bg-red-100 border-red-200" },
    { id: "principal", label: "Principal", icon: School, color: "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200" },
    { id: "teacher", label: "Teacher", icon: GraduationCap, color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" },
    { id: "student", label: "Student", icon: Users, color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200" },
    { id: "parent", label: "Parent", icon: HeartHandshake, color: "text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200" }
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-slate-950 flex items-center gap-2">
              SmartEdu AI <span className="text-xs font-sans font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">Gemini-Powered</span>
            </h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5">Intelligent School Management System</p>
          </div>
        </div>

        {/* Live Status Tracker */}
        <div className="flex flex-col items-start md:items-end gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">Perspective Role Switcher</span>
          <div className="flex flex-wrap items-center gap-2">
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = currentRole === role.id;
              return (
                <button
                  key={role.id}
                  id={`role-btn-${role.id}`}
                  onClick={() => onRoleChange(role.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm scale-102"
                      : `bg-white border-slate-200 text-slate-600 hover:border-slate-300`
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
