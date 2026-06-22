/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Users, Coins, Sparkles, RefreshCw, Languages, FileText, CheckCircle2, Award } from "lucide-react";
import { Student } from "../types";
import ScholasticResultsLedger from "./ScholasticResultsLedger";
import SchoolFeesRegistry from "./SchoolFeesRegistry";

interface ParentDashboardProps {
  students: Student[];
  loggedInStudentId?: string | null;
  onLogout?: () => void;
  onPayFees: (studentId: string, amount: number, method: string, remarks?: string) => Promise<boolean>;
}

export default function ParentDashboard({ 
  students,
  loggedInStudentId,
  onLogout,
  onPayFees
}: ParentDashboardProps) {
  const [selectedParentId, setSelectedParentId] = useState(loggedInStudentId || "std-1");
  const [language, setLanguage] = useState("English");
  const [generating, setGenerating] = useState(false);
  const [translatedLetter, setTranslatedLetter] = useState<string | null>(null);

  useEffect(() => {
    if (loggedInStudentId) {
      setSelectedParentId(loggedInStudentId);
    }
  }, [loggedInStudentId]);

  const activeStudent = students.find((s) => s.id === selectedParentId) || students[0];

  const handleGenerateUpdate = async () => {
    setGenerating(true);
    setTranslatedLetter(null);
    try {
      const res = await fetch("/api/school/parent-comm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: activeStudent.id, language })
      });
      const data = await res.json();
      setTranslatedLetter(data.result);
    } catch (err) {
      // Fallback translations
      const fallbacks: { [key: string]: string } = {
        English: `Dear Parent (${activeStudent.parentName}),

Here is a warm academic status update regarding your child, ${activeStudent.name}.

We are pleased to report that ${activeStudent.name} maintains a highly compliant attendance rate of ${activeStudent.attendanceRate}%. Academically, average scores look solid across all subjects (Mathematics: ${activeStudent.grades.Mathematics || 75}%, Computer Science: ${activeStudent.grades["Computer Science"] || 80}%).

Regarding school fees, the current ledger shows the status is: "${activeStudent.schoolFeesStatus.status}".

Please reach out to the class teacher if you have any questions or feedback.

Best regards,
SmartEdu Administration`,

        Urdu: `محترم سرپرست (${activeStudent.parentName})،

السلام علیکم! یہ آپ کے بچے ${activeStudent.name} کی تعلیمی اور حاضری کی صورتحال کے بارے میں ایک اہم ترین اپ ڈیٹ خط ہے۔

ہم یہ بتاتے ہوئے خوشی محسوس کر رہے ہیں کہ ${activeStudent.name} کی حاضری کی شرح ${activeStudent.attendanceRate}% ہے۔ ان کی تعلیمی کارکردگی (ریاضی: ${activeStudent.grades.Mathematics || 75}%، کمپیوٹر سائنس: ${activeStudent.grades["Computer Science"] || 80}%) مستحکم ہے۔

سکول فیس کی ادائیگی کی موجودہ صورتحال: "${activeStudent.schoolFeesStatus.status}" ہے۔

کسی بھی قسم کی رہنمائی یا سوال کے لیے آپ کلاس ٹیچر سے براہ راست رابطہ کر سکتے ہیں۔

نیک تمنائیں،
سمارٹ ایڈو انتظامیہ`,

        Arabic: `عزيزي ولي الأمر (${activeStudent.parentName})،

تحية طيبة وبعد، يسعدنا أن نرسل لكم هذا التقرير الأكاديمي الموجز بشأن طفلكم ${activeStudent.name}.

يسعدنا إبلاغكم بأن نسبة حضور ${activeStudent.name} ممتازة وتبلغ ${activeStudent.attendanceRate}%. كما أن النتائج الدراسية (الرياضيات: ${activeStudent.grades.Mathematics || 75}%، علوم الحاسوب: ${activeStudent.grades["Computer Science"] || 80}%) مستقرة ومبشرة للغاية.

فيما يتعلق بمستحقات الرسوم المدرسية، فإن حالة الحساب الحالية هي: "${activeStudent.schoolFeesStatus.status}".

لا تترددوا في الاتصال بمعلم الصف لأي استفسار.

مع خالص التقدير،
إدارة مدارس سمارت إيدو`
      };

      setTranslatedLetter(fallbacks[language] || fallbacks["English"]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Select */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Parent Dashboard</h2>
          <p className="text-sm text-slate-500">Monitor academic reports, attendance histories, outstanding ledgers, and family communication</p>
        </div>

        {/* Swap Parents to demonstrate Paid vs Unpaid structures */}
        {loggedInStudentId ? (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100/50 px-4 py-2 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-50 shrink-0 font-mono">
              {activeStudent.parentName.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">Guardian: {activeStudent.parentName}</p>
              <p className="text-[10px] text-slate-500 font-medium">Ward: <span className="font-semibold text-indigo-600">{activeStudent.name}</span> (Class {activeStudent.grade})</p>
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
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-sans">Parent Login:</span>
            <select
              value={selectedParentId}
              onChange={(e) => { setSelectedParentId(e.target.value); setTranslatedLetter(null); }}
              className="text-xs font-bold px-3 py-2 border border-slate-200 bg-white rounded-lg outline-indigo-500 text-slate-800"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.parentName} ({s.name}'s Guardian)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Academic GPA & Attendance summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="w-full">
            {/* Student Profile Overview */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block mb-1">Child Profile</span>
              <h3 className="font-display font-bold text-slate-900 text-lg">{activeStudent.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Stream Roll ID: {activeStudent.rollNumber} &bull; Class {activeStudent.grade}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block">Attendance Rate</span>
                  <span className={`font-bold block mt-0.5 ${activeStudent.attendanceRate > 90 ? "text-emerald-600" : activeStudent.attendanceRate > 75 ? "text-amber-600" : "text-rose-500"}`}>
                    {activeStudent.attendanceRate}% Compliance
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-right">Academic Standing</span>
                  <span className="font-bold text-indigo-700 block text-right">Good Status</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: CHILD TUITION & BILLING REGISTRY */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Coins className="w-5 h-5 text-indigo-650" />
                  Child Tuition Accounts & Secure Ledger Remittance
                </h3>
                <p className="text-xs text-slate-500">View detailed invoices, payment receipts history, and complete electronic clearing payments.</p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[10px] font-bold text-indigo-755 font-mono self-start sm:self-center">
                Parent Remittance Portal
              </span>
            </div>

            <SchoolFeesRegistry
              students={students}
              singleStudentId={activeStudent.id}
              viewMode="parent"
              onPayFees={onPayFees}
            />
          </div>

          {/* Child Subjects Gradebook */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-display font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Progress Record Detail
            </h3>

            <div className="space-y-3">
              {Object.entries(activeStudent.grades).map(([subject, val]) => (
                <div key={subject} className="flex items-center justify-between text-xs py-1">
                  <span className="font-semibold text-slate-700">{subject}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
                      <div className="bg-indigo-600 h-full rounded" style={{ width: `${val}%` }}></div>
                    </div>
                    <span className="font-bold text-slate-900 w-8 text-right font-mono">{val}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION: CHILD SCHOLASTIC LEDGER */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-indigo-50 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-650 animate-pulse" />
                  Detailed Child Academic Ledger
                </h3>
                <p className="text-xs text-slate-500">Examine monthly examination benchmarks, midterm reports, and final examination achievements.</p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[10px] font-bold text-indigo-750 font-mono self-start sm:self-center">
                Parent Portal Lock
              </span>
            </div>

            <ScholasticResultsLedger
              students={students}
              singleStudentId={activeStudent.id}
              viewMode="individual"
            />
          </div>
        </div>

        {/* AI Multilingual Update Letter */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[400px]">
          <div className="flex flex-col flex-grow overflow-hidden">
            <div className="border-b border-slate-100 pb-3 mb-3 shrink-0">
              <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Gemini Multilingual Update
              </h3>
              <p className="text-xs text-slate-400">AI-translated school progress reports</p>
            </div>

            {/* Select preferred language */}
            <div className="flex items-center gap-2 shrink-0 mb-3 block">
              <Languages className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Select language:</span>
              <select
                value={language}
                onChange={(e) => { setLanguage(e.target.value); setTranslatedLetter(null); }}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-indigo-500"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu (اردو)</option>
                <option value="Arabic">Arabic (العربية)</option>
              </select>
            </div>

            {/* Translated letter content */}
            <div className="flex-grow overflow-y-auto bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs scroller-classic">
              {translatedLetter ? (
                <div className="space-y-2 whitespace-pre-wrap leading-relaxed text-slate-700 font-sans">
                  {translatedLetter}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                  <Languages className="w-6 h-6 text-indigo-400" />
                  <p className="font-display font-semibold text-slate-800 text-xs">Awaiting Generation</p>
                  <p className="text-[10px] text-slate-400">Click the generate button below to translate report comments instantly.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-4 shrink-0">
            <button
              onClick={handleGenerateUpdate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Writing Update Summary...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI Statement Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
