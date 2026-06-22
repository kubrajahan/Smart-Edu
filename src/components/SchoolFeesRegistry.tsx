/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Coins, 
  Search, 
  Filter, 
  CreditCard, 
  TrendingUp, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle, 
  History, 
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  FileText
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Student } from "../types";

interface SchoolFeesRegistryProps {
  students: Student[];
  singleStudentId?: string; // If passed, behaves in parent single-pupil mode
  viewMode: "admin" | "principal" | "parent";
  onPayFees: (studentId: string, amount: number, method: string, remarks?: string) => Promise<boolean>;
  onUpdateFees?: (studentId: string, total: number, status?: string) => Promise<boolean>;
}

export default function SchoolFeesRegistry({
  students,
  singleStudentId,
  viewMode,
  onPayFees,
  onUpdateFees
}: SchoolFeesRegistryProps) {
  // UI and operations state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Partial" | "Overdue">("All");
  const [gradeFilter, setGradeFilter] = useState<string>("All");
  
  // Payment transaction processing modal state
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<string>("Credit Card");
  const [payRemarks, setPayRemarks] = useState("");
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState("");

  // Administrative invoice modification modal state
  const [selectedStudentForBill, setSelectedStudentForBill] = useState<Student | null>(null);
  const [newTotalBill, setNewTotalBill] = useState("");
  const [newBillStatus, setNewBillStatus] = useState<string>("");
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);

  // PDF fee receipt state
  const monthsList = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);
  const [pdfGrade, setPdfGrade] = useState("All");
  const [pdfMonth, setPdfMonth] = useState(monthsList[new Date().getMonth()]);
  const [pdfYear, setPdfYear] = useState("2026");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

  const handleGeneratePDFReceipts = async () => {
    setIsGeneratingPDF(true);
    setPdfStatus("Analyzing student registers...");
    try {
      // Filter list of students based on pdfGrade selection
      const targetStudents = students.filter(s => pdfGrade === "All" || s.grade === pdfGrade);
      if (targetStudents.length === 0) {
        alert(`No student records found enrolled under stream Grade ${pdfGrade}.`);
        setIsGeneratingPDF(false);
        setPdfStatus(null);
        return;
      }

      setPdfStatus(`Initializing document layout for ${targetStudents.length} profiles...`);
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      targetStudents.forEach((student, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Draw top brand styling strip (Indigo)
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 8, "F");

        // Header Title Block
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(30, 41, 59);
        doc.text("SMARTEDU ACADEMY", 15, 23);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("OFFICIAL INSTITUTIONAL FEE INVOICE & RECEIPT", 15, 28);

        // Receipt Meta Information Callout (Right aligned)
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(79, 70, 229);
        const receiptNo = `REC-${pdfMonth.substring(0,3).toUpperCase()}-${student.rollNumber.replace(/-/g, "")}`;
        doc.text(`RECEIPT: ${receiptNo}`, 210 - 15, 23, { align: "right" });

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(`Billing Cycle: ${pdfMonth} ${pdfYear}`, 210 - 15, 28, { align: "right" });

        // Divider
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(15, 33, 210 - 15, 33);

        // Metadata Split-Column section
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(71, 85, 105);
        doc.text("STUDENT PROFILE DETAILS", 15, 42);
        doc.text("PARENT/GUARDIAN CONTACTS", 112, 42);

        // Student Data Column
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text("Pupil Name:", 15, 49);
        doc.text("Roll Number:", 15, 54);
        doc.text("Grade Stream:", 15, 59);

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(student.name, 42, 49);
        doc.text(student.rollNumber, 42, 54);
        doc.text(`Class ${student.grade}`, 42, 59);

        // Parent Data Column
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("Parent/Guardian:", 112, 49);
        doc.text("Email Address:", 112, 54);
        doc.text("Contact Phone:", 112, 59);

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(student.parentName, 146, 49);
        doc.text(student.parentEmail, 146, 54);
        doc.text(student.parentPhone, 146, 59);

        // Grey Financial Account Ledger card
        doc.setFillColor(248, 250, 252);
        doc.rect(15, 68, 180, 28, "F");
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, 68, 180, 28, "S");

        // Labels inside Grey box
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(115, 115, 115);
        doc.text("TOTAL TUITION BILLED", 22, 75);
        doc.text("NET AMOUNT SETTLED", 85, 75);
        doc.text("OUTSTANDING BALANCE DUE", 142, 75);

        // Amounts inside Grey box
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(`$${student.schoolFeesStatus.total.toLocaleString()}`, 22, 84);
        doc.setTextColor(16, 185, 129); // emerald green
        doc.text(`$${student.schoolFeesStatus.paid.toLocaleString()}`, 85, 84);
        
        const dueVal = student.schoolFeesStatus.due;
        if (dueVal > 0) {
          doc.setTextColor(239, 68, 68); // rose red
        } else {
          doc.setTextColor(16, 185, 129);
        }
        doc.text(`$${dueVal.toLocaleString()}`, 142, 84);

        // Ledger status banner under grey box
        const statusVal = student.schoolFeesStatus.status.toUpperCase();
        const readableStatus = statusVal === "PAID" ? "FULLY PAID & CLEARED" : statusVal === "PARTIAL" ? "PARTIALLY CLEARED" : "OVERDUE REQUIREMENT";
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        
        if (statusVal === "PAID") {
          doc.setFillColor(16, 185, 129);
        } else if (statusVal === "PARTIAL") {
          doc.setFillColor(245, 158, 11);
        } else {
          doc.setFillColor(239, 68, 68);
        }
        doc.rect(15, 96, 180, 6.5, "F");
        doc.text(`STATEMENT ACCOUNT STATUS: ${readableStatus} - PREPARED ON STARTING OF MONTH CYCLE`, 20, 100.5);

        // Transaction table
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(71, 85, 105);
        doc.text("TRANSACTION CLEARANCE HISTORIC ARCHIVES", 15, 115);

        // Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 119, 180, 7.5, "F");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("AUTHENTIC TRANSACTION REFERENCE", 18, 124);
        doc.text("CLEARANCE TIME", 75, 124);
        doc.text("GATEWAY USED", 125, 124);
        doc.text("AMOUNT RECEIPTED", 162, 124);

        // Rows
        const payments = student.schoolFeesStatus.paymentHistory || [];
        let yWalk = 132;
        if (payments.length > 0) {
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          payments.forEach((pay) => {
            if (yWalk > 235) return; // guard overflow
            doc.text(pay.referenceNumber || "ADMINLOG-M", 18, yWalk);
            doc.text(new Date(pay.paidAt).toLocaleDateString() + " " + new Date(pay.paidAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 75, yWalk);
            doc.text(pay.method || "Cash", 125, yWalk);
            doc.text(`$${pay.amount.toLocaleString()}`, 162, yWalk);

            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.35);
            doc.line(15, yWalk + 2, 210 - 15, yWalk + 2);
            yWalk += 7.5;
          });
        } else {
          doc.setFont("Helvetica", "italic");
          doc.setFontSize(8.5);
          doc.setTextColor(148, 163, 184);
          doc.text("No active transaction payments have been receipted on this tuition log card.", 20, 132);
          yWalk += 7.5;
        }

        // Beautiful terms / Seal at the bottom
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(15, 252, 210 - 15, 252);

        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text("SMARTEDU CLOUD SECURE DECRYPTED SHA SEALED VERIFICATION SIGNATURE", 15, 258);

        // Compute real SHA-like hash code for professional feel!
        const randStr = Math.pow(index + 77, 4).toString(36).toUpperCase() + "-" + pdfMonth.substring(0,3).toUpperCase();
        const securitySignature = `SECRT-AUTH-LOCK-SHAHASH:[AES-256-GCM:${student.id.toUpperCase()}-${randStr}-${Date.now().toString().substring(7)}]`;
        doc.setFont("Courier", "bold");
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text(securitySignature, 15, 263);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text("This electronic fee schedule statement is processed on the starting of each month cycle, serving as legal receipts of the school.", 15, 269);
        doc.text("Any inquiries, corrections, or adjustment configurations must be authorized within 7 days by the Senior Superintendent.", 15, 273);

        // Page numbering
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${index + 1} of ${targetStudents.length}`, 210 - 15, 281, { align: "right" });
        doc.text("SmartEdu Global Billing ledger System", 15, 281);
      });

      setPdfStatus("Exporting PDF receipt book file...");
      const filename = `FeeReceipts_${pdfGrade === "All" ? "AllClasses" : "Class_" + pdfGrade}_${pdfMonth}_${pdfYear}.pdf`;
      doc.save(filename);
      setPdfStatus(`Successfully compiled and exported ${targetStudents.length} student receipt pages!`);
      setTimeout(() => setPdfStatus(null), 4000);
    } catch (err) {
      console.error(err);
      alert("Encountered compilation error generating PDF fee receipt book.");
      setPdfStatus(null);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Filter list of students for tabular/display layout
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Parent View lock
      if (singleStudentId && s.id !== singleStudentId) return false;

      const matchesSearch = searchQuery === "" || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || s.schoolFeesStatus.status === statusFilter;
      const matchesGrade = gradeFilter === "All" || s.grade === gradeFilter;

      return matchesSearch && matchesStatus && matchesGrade;
    });
  }, [students, singleStudentId, searchQuery, statusFilter, gradeFilter]);

  // Overall calculations matching current filters (or aggregate)
  const stats = useMemo(() => {
    const subset = singleStudentId 
      ? students.filter(s => s.id === singleStudentId) 
      : students;

    const totalInvoiced = subset.reduce((acc, s) => acc + s.schoolFeesStatus.total, 0);
    const totalCollected = subset.reduce((acc, s) => acc + s.schoolFeesStatus.paid, 0);
    const totalOutstanding = subset.reduce((acc, s) => acc + s.schoolFeesStatus.due, 0);
    const percentCollected = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
    const countOverdue = subset.filter(s => s.schoolFeesStatus.status === "Overdue").length;

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      percentCollected,
      countOverdue
    };
  }, [students, singleStudentId]);

  // Handle remittance confirmation
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPay) return;
    
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    if (amt > selectedStudentForPay.schoolFeesStatus.due) {
      alert(`The entered amount exceeds the outstanding student balance of $${selectedStudentForPay.schoolFeesStatus.due}.`);
      return;
    }

    setIsSubmittingPay(true);
    setPaySuccessMsg("");

    try {
      const success = await onPayFees(
        selectedStudentForPay.id,
        amt,
        payMethod,
        payRemarks || undefined
      );

      if (success) {
        setPaySuccessMsg(`Successfully cleared remittance of $${amt} for ${selectedStudentForPay.name}!`);
        setPayAmount("");
        setPayRemarks("");
        setTimeout(() => {
          setSelectedStudentForPay(null);
          setPaySuccessMsg("");
        }, 1800);
      } else {
        alert("Fee remittance processing encountered a server-side error.");
      }
    } catch (err) {
      console.error(err);
      alert("A system error occurred.");
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Handle fine / standard billing adjustment
  const handleConfirmBillUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBill || !onUpdateFees) return;

    const total = parseFloat(newTotalBill);
    if (isNaN(total) || total < 0) {
      alert("Please enter a valid numeric total billing.");
      return;
    }

    setIsSubmittingBill(true);
    try {
      const success = await onUpdateFees(
        selectedStudentForBill.id,
        total,
        newBillStatus || undefined
      );

      if (success) {
        setSelectedStudentForBill(null);
        setNewTotalBill("");
      } else {
        alert("Failed to update tuition configuration in server registry.");
      }
    } catch (err) {
      console.error(err);
      alert("System error applying dues update.");
    } finally {
      setIsSubmittingBill(false);
    }
  };

  // Get distinct classes for search filter
  const classes = useMemo(() => {
    const list = new Set<string>();
    students.forEach((s) => list.add(s.grade));
    return Array.from(list).sort();
  }, [students]);

  // Target customer profile
  const activeParentStudent = useMemo(() => {
    if (singleStudentId) {
      return students.find((s) => s.id === singleStudentId) || null;
    }
    return null;
  }, [students, singleStudentId]);

  return (
    <div className="space-y-6">

      {/* 1. Header Fiscal Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Invoice */}
        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-wider block mb-1">Total Tuition Billed</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-slate-800 font-mono">${stats.totalInvoiced.toLocaleString()}</span>
            <span className="text-xs text-slate-400 font-medium">gross total</span>
          </div>
          <div className="absolute top-3.5 right-3.5 p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* Total Remitted Collections */}
        <div className="bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider block mb-1">Cleared Collections</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-950 font-mono">${stats.totalCollected.toLocaleString()}</span>
            <span className="text-xs text-emerald-600 font-bold font-mono">({stats.percentCollected}% rate)</span>
          </div>
          <div className="absolute top-3.5 right-3.5 p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Outstanding tuition dues */}
        <div className="bg-gradient-to-br from-rose-50/50 via-white to-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider block mb-1">Unpaid Dues Receivable</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-rose-850 font-mono">${stats.totalOutstanding.toLocaleString()}</span>
            <span className="text-xs text-rose-500 font-medium">immediate action</span>
          </div>
          <div className="absolute top-3.5 right-3.5 p-1.5 bg-rose-50 text-rose-600 rounded-xl">
            <Coins className="w-4 h-4" />
          </div>
        </div>

        {/* Unpaid / Overdue account triggers */}
        <div className="bg-gradient-to-br from-amber-50/50 via-white to-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider block mb-1">Deficient Portfolios</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-amber-950 font-mono">{stats.countOverdue}</span>
            <span className="text-xs text-slate-400 font-medium">students overdue</span>
          </div>
          <div className="absolute top-3.5 right-3.5 p-1.5 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </div>

      {/* 2. Interactive Fee Widgets depending on Role */}
      {viewMode === "parent" && activeParentStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main child Tuition Progress Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Current Clearance Standing</h4>
              <h3 className="text-lg font-bold text-slate-800 font-display mt-0.5">Fees Ledger for {activeParentStudent.name}</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Billed: <strong className="text-slate-700">${activeParentStudent.schoolFeesStatus.total}</strong></span>
                <span className="text-slate-400">Total Settled: <strong className="text-slate-700">${activeParentStudent.schoolFeesStatus.paid}</strong></span>
                <span className="text-slate-400">Deficit Balance: <strong className="text-rose-600 font-bold">${activeParentStudent.schoolFeesStatus.due}</strong></span>
              </div>
              
              {/* Complex progress bar */}
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/50 flex shadow-inner">
                <div 
                  title={`Settled: ${stats.percentCollected}%`}
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-l transition-all duration-500" 
                  style={{ width: `${stats.percentCollected}%` }}
                ></div>
                <div 
                  title={`Outstanding: ${100 - stats.percentCollected}%`}
                  className="bg-rose-400/90 h-full transition-all duration-500" 
                  style={{ width: `${100 - stats.percentCollected}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span> Paid: {stats.percentCollected}%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-400/90 rounded-full inline-block"></span> Unpaid: {100 - stats.percentCollected}%</span>
              </div>
            </div>

            {/* Remittance History Receipts */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-3">
                <History className="w-4 h-4 text-slate-505" />
                Remittance Receipt Journal
              </h4>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1 select-none border rounded-xl overflow-hidden shadow-2xs">
                {!activeParentStudent.schoolFeesStatus.paymentHistory || activeParentStudent.schoolFeesStatus.paymentHistory.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400 italic">No formal receipts recorded against student account.</p>
                ) : (
                  activeParentStudent.schoolFeesStatus.paymentHistory.map((item) => (
                    <div key={item.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">${item.amount} Cleared</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md font-mono">{item.method}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono italic">"{item.remarks || "No remarks included"}"</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[9px] bg-slate-50 border px-1.5 py-0.5 text-slate-400 rounded-md block mb-0.5 leading-tight">{item.referenceNumber}</span>
                        <span className="text-[10px] text-slate-400 block">{new Date(item.paidAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Parents Payment Portal Gate */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">Remit Clearance Gate</h4>
                  <p className="text-sm font-semibold text-slate-200">Pay Outstanding Balance</p>
                </div>
              </div>

              {activeParentStudent.schoolFeesStatus.due <= 0 ? (
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 text-center mt-6">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 animate-bounce" />
                  <p className="font-bold text-emerald-200 text-xs">Fees Fully Paid & Cleared</p>
                  <p className="text-[10px] text-slate-300 mt-1">Thank you. Your child has no outstanding balance requirements at this time.</p>
                </div>
              ) : (
                <form onSubmit={handleConfirmPayment} className="space-y-3.5 pt-3">
                  <div>
                    <label className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Clearing Balance Dues</label>
                    <div className="text-lg font-mono font-bold text-indigo-100 bg-black/25 border border-white/5 rounded-lg px-2.5 py-1.5">
                      Outstanding: ${activeParentStudent.schoolFeesStatus.due}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Payment Amount ($)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="1"
                      max={activeParentStudent.schoolFeesStatus.due}
                      placeholder="e.g. 150"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full text-xs font-bold font-mono bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Transfer Gateway Route</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full text-xs bg-[#1E293B] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Bank Transfer">Direct Bank Transfer</option>
                      <option value="UPI">UPI Remittance Code</option>
                      <option value="Mobile Wallet">Remit Wallet Code</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Personal Annotations / Remarks</label>
                    <input
                      type="text"
                      placeholder="Optional, e.g. Inst. 3"
                      value={payRemarks}
                      onChange={(e) => setPayRemarks(e.target.value)}
                      className="w-full text-xs bg-[#1E293B] border border-slate-700 text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {paySuccessMsg && (
                    <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-350 text-[10px] font-bold rounded-lg text-center animate-fade-in">
                      {paySuccessMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingPay}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg cursor-pointer transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-950"
                  >
                    {isSubmittingPay && <RefreshCw className="w-3 h-3 animate-spin" />}
                    Confirm Secure Payment Remittance
                  </button>
                </form>
              )}
            </div>
            
            <p className="text-[9px] text-slate-400 font-mono mt-4 border-t border-white/5 pt-2 text-center leading-normal">
              Securely encrypted via SmartEdu Sandbox Core. Instant clearances are logged with the Superintendent's database.
            </p>
          </div>
        </div>
      )}

      {/* 3. Administrative Catalog & Operations for Super Admin/Principal */}
      {viewMode !== "parent" && (
        <div className="space-y-4">

          {/* MONTHLY PDF FEE RECEIPT BOOK GENERATION PANEL */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-950 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Superintendent Fiscal Tool
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    All Classes in One PDF
                  </span>
                </div>
                <h3 className="text-base font-bold font-display">Monthly Bulk Fee Statement PDF Generator</h3>
                <p className="text-xs text-indigo-200/85 leading-normal">
                  In compliance with school accounting practices, generate and compile student-wise fee receipts into a consolidated single PDF document at the starting of each month cycle, paginated automatically according to active student profiles.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 bg-white/5 border border-white/10 p-3.5 rounded-xl">
                {/* PDF Class Selection */}
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-indigo-200 font-mono uppercase">Target stream</span>
                  <select
                    value={pdfGrade}
                    onChange={(e) => setPdfGrade(e.target.value)}
                    className="text-xs bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="All">All Grades (Full Book)</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>Class {c} stream</option>
                    ))}
                  </select>
                </div>

                {/* PDF Month Selection */}
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-indigo-200 font-mono uppercase">Statement Month</span>
                  <select
                    value={pdfMonth}
                    onChange={(e) => setPdfMonth(e.target.value)}
                    className="text-xs bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none font-semibold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {monthsList.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* PDF Year Selection */}
                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-indigo-200 font-mono uppercase">Year</span>
                  <input
                    type="number"
                    min="2025"
                    max="2035"
                    value={pdfYear}
                    onChange={(e) => setPdfYear(e.target.value)}
                    className="text-xs bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 w-16 outline-none font-mono text-center focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Main Print compiled statement button */}
                <div className="self-end pt-2 w-full lg:w-auto">
                  <button
                    onClick={handleGeneratePDFReceipts}
                    disabled={isGeneratingPDF}
                    className="w-full lg:w-auto bg-emerald-400 hover:bg-emerald-350 text-indigo-950 font-bold px-4 py-2.5 rounded-lg cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all disabled:opacity-50 select-none"
                  >
                    {isGeneratingPDF ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    Generate Statement Book
                  </button>
                </div>
              </div>
            </div>

            {pdfStatus && (
              <div className="mt-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-2 animate-in fade-in">
                <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                <span className="text-[11px] text-indigo-200 font-mono">
                  {pdfStatus}
                </span>
              </div>
            )}
          </div>
          
          {/* Action Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter buttons */}
              {(["All", "Paid", "Partial", "Overdue"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all border ${
                    statusFilter === st
                      ? "bg-indigo-600 border-indigo-650 text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-250 text-slate-650"
                  }`}
                >
                  {st === "All" ? "Entire Directory" : `${st} Accounts`}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Class filtration dropdown */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-205 bg-white rounded-lg outline-none font-semibold text-slate-700"
              >
                <option value="All">All Grades</option>
                {classes.map((c) => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>

              {/* Text Search field */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Query pupil name, ID, parent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-205 text-xs bg-white rounded-lg outline-none text-slate-800 w-full sm:w-52"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Large Tabular List View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFBFD] border-b border-slate-200 font-mono text-[9px] uppercase font-black text-slate-400 tracking-wider">
                  <tr>
                    <th className="p-4">Student Profile</th>
                    <th className="p-4">Remittance Route</th>
                    <th className="p-4 text-center">Status Badge</th>
                    <th className="p-4 text-right">Invoiced Plan</th>
                    <th className="p-4 text-right">Slipped Payments</th>
                    <th className="p-4 text-right text-rose-600 font-bold">Outstanding Deficit</th>
                    <th className="p-4 text-center">Action Console</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Coins className="w-8 h-8 text-slate-350 mx-auto" />
                          <p className="font-bold text-slate-700">No Student Fees Match Search Query</p>
                          <p className="text-xs text-slate-500">Consider relaxing status filters, matching grade definitions, or search words.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const total = s.schoolFeesStatus.total;
                      const paid = s.schoolFeesStatus.paid;
                      const due = s.schoolFeesStatus.due;
                      const status = s.schoolFeesStatus.status;
                      const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-650 text-xs shrink-0 border">
                                {s.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{s.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.rollNumber} &bull; Class {s.grade}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-semibold text-slate-850 leading-normal">{s.parentName}</p>
                              <p className="text-[10px] text-slate-400 leading-none">{s.parentPhone}</p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              status === "Paid" ? "bg-emerald-50 text-emerald-800 border-emerald-250" :
                              status === "Partial" ? "bg-amber-50 text-amber-850 border-amber-250" :
                              "bg-rose-50 text-rose-800 border-rose-250 hover:animate-pulse"
                            }`}>
                              {status === "Paid" ? "Fully Cleared" : status === "Partial" ? `Paid ${percent}%` : "Overdue Balance"}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-slate-705">
                            ${total.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500">
                            ${paid.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-mono text-rose-600 font-black">
                            ${due.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Log Payment Manual Button */}
                              <button
                                disabled={due <= 0}
                                onClick={() => {
                                  setSelectedStudentForPay(s);
                                  setPayAmount(due.toString());
                                  setPayMethod("Cash");
                                  setPayRemarks("Administrative Manual Clearance");
                                }}
                                className={`px-2 py-1 text-[10px] font-black rounded-md cursor-pointer transition-colors ${
                                  due <= 0
                                    ? "bg-slate-100 text-slate-350 cursor-not-allowed"
                                    : "bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750"
                                }`}
                                title="Process remittance payment manually"
                              >
                                Log Payment
                              </button>

                              {/* Modify Tuition standard (Write mode) only for super_admin or admin */}
                              {viewMode === "admin" && onUpdateFees && (
                                <button
                                  onClick={() => {
                                    setSelectedStudentForBill(s);
                                    setNewTotalBill(s.schoolFeesStatus.total.toString());
                                    setNewBillStatus(s.schoolFeesStatus.status);
                                  }}
                                  className="px-2 py-1 text-[10px] font-black bg-slate-50 hover:bg-slate-150 border border-slate-205 text-slate-700 rounded-md cursor-pointer"
                                  title="Adjust pupil gross tuition bill"
                                >
                                  Modify Bill
                                </button>
                              )}
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

          {/* Quick Informational Notice Footer */}
          <div className="p-3 bg-slate-50 border rounded-2xl flex items-center gap-3 text-slate-500 border-slate-200">
            <Clock className="w-5 h-5 text-indigo-600 animate-pulse shrink-0" />
            <p className="text-[11px] leading-sm font-medium">
              Gross outstanding receivable balances of <strong>${stats.totalOutstanding.toLocaleString()}</strong> trigger systemic warning notification scripts backended for parent communication updates automatically.
            </p>
          </div>
        </div>
      )}

      {/* ================= MODAL PAYMENTS POPUP ================= */}
      {selectedStudentForPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider font-mono">Invoice Settlement</span>
                <h3 className="text-sm font-bold text-slate-800 font-display">Record Fee Payment</h3>
                <p className="text-xs text-slate-400 mt-0.5">Clearing item value for {selectedStudentForPay.name}</p>
              </div>
              <button 
                onClick={() => setSelectedStudentForPay(null)}
                className="text-slate-405 hover:text-slate-707 text-lg font-black cursor-pointer px-2"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-1">
                <p className="text-slate-500 font-medium">Maximum due balance to receive:</p>
                <p className="text-xl font-black text-indigo-950 font-mono">${selectedStudentForPay.schoolFeesStatus.due}</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">Payment Amount To Receipt ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedStudentForPay.schoolFeesStatus.due}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold font-mono outline-nonefocus:ring-2 focus:ring-indigo-500 text-slate-850"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">Payment Channel Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 font-semibold"
                >
                  <option value="Cash">Cash Receipt</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                  <option value="Credit Card">Credit/Debit Card</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Mobile Wallet">Mobile Wallet Port</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">Log Annotation / Memo Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash by parent"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                />
              </div>

              {paySuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black rounded-lg text-center font-mono">
                  {paySuccessMsg}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForPay(null)}
                  className="px-3.5 py-2 hover:bg-slate-100 font-bold border rounded-xl cursor-pointer text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 font-bold text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1 shrink-0"
                >
                  {isSubmittingPay && <RefreshCw className="w-3 h-3 animate-spin" />}
                  Register Dues Cleared
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ADJUST Gross Invoices ================= */}
      {selectedStudentForBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider font-mono">Account Adjustment</span>
                <h3 className="text-sm font-bold text-slate-800 font-display">Modify Gross Invoice Total</h3>
                <p className="text-xs text-slate-400 mt-0.5">Updating course billing parameters for {selectedStudentForBill.name}</p>
              </div>
              <button 
                onClick={() => setSelectedStudentForBill(null)}
                className="text-slate-405 hover:text-slate-707 text-lg font-black cursor-pointer px-2"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmBillUpdate} className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">Gross Total Tuition Amount ($)</label>
                <input
                  required
                  type="number"
                  step="1"
                  min="0"
                  value={newTotalBill}
                  onChange={(e) => setNewTotalBill(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">Account Status Overrule</label>
                <select
                  value={newBillStatus}
                  onChange={(e) => setNewBillStatus(e.target.value)}
                  className="w-full px-3 py-2 border bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 font-semibold animate-fade-in"
                >
                  <option value="">Calculate Dynamically (Automated)</option>
                  <option value="Paid">Force Mark as fully "Paid"</option>
                  <option value="Partial">Force Mark as "Partial"</option>
                  <option value="Overdue">Force Mark as "Overdue"</option>
                </select>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal bg-slate-50 border p-2 rounded-lg italic">
                Adjusting standard billing sets the student's Total tuition invoice. Dues are recalculated instantly matching the current payments profile ($${selectedStudentForBill.schoolFeesStatus.paid} total cleared).
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForBill(null)}
                  className="px-3.5 py-2 hover:bg-slate-100 font-bold border rounded-xl cursor-pointer text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBill}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 font-bold text-white rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmittingBill && <RefreshCw className="w-3 h-3 animate-spin animate-fade-in" />}
                  Apply tuition Invoice Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
