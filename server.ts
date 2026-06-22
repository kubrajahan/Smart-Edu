/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Successfully initialized Gemini Client.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined. AI automation modules will run in demo/fallback mode.");
}

const PORT = 3000;

async function start() {
  const app = express();
  app.use(express.json());

  // Persistent JSON-based Database State Configuration
  const DB_PATH = path.join(process.cwd(), "school_db.json");

  const defaultStudents = [
    {
      id: "std-1",
      name: "Aisha Rahman",
      rollNumber: "S2026-101",
      grade: "10-A",
      gender: "Female",
      parentName: "Fatima Rahman",
      parentEmail: "fatima.rahman@example.com",
      parentPhone: "+92 300 1234567",
      attendanceRate: 98,
      riskLevel: "Low",
      grades: { "Mathematics": 92, "Science": 94, "English": 89, "Social Studies": 91, "Computer Science": 95 },
      attendanceHistory: [
        { date: "2026-06-18", status: "Present" },
        { date: "2026-06-19", status: "Present" },
        { date: "2026-06-20", status: "Present" },
        { date: "2026-06-21", status: "Present" },
        { date: "2026-06-22", status: "Present" }
      ],
      schoolFeesStatus: { total: 1200, paid: 1200, due: 0, status: "Paid" }
    },
    {
      id: "std-2",
      name: "Zayd Patel",
      rollNumber: "S2026-102",
      grade: "10-A",
      gender: "Male",
      parentName: "Ibrahim Patel",
      parentEmail: "ibrahim.patel@example.com",
      parentPhone: "+44 207 123456",
      attendanceRate: 84,
      riskLevel: "Medium",
      grades: { "Mathematics": 74, "Science": 68, "English": 80, "Social Studies": 72, "Computer Science": 78 },
      attendanceHistory: [
        { date: "2026-06-18", status: "Present" },
        { date: "2026-06-19", status: "Absent" },
        { date: "2026-06-20", status: "Present" },
        { date: "2026-06-21", status: "Present" },
        { date: "2026-06-22", status: "Absent" }
      ],
      schoolFeesStatus: { total: 1200, paid: 800, due: 400, status: "Partial" }
    },
    {
      id: "std-3",
      name: "Omar Farooq",
      rollNumber: "S2026-103",
      grade: "9-B",
      gender: "Male",
      parentName: "Aminah Farooq",
      parentEmail: "aminah.farooq@example.com",
      parentPhone: "+971 50 1234567",
      attendanceRate: 62,
      riskLevel: "High",
      grades: { "Mathematics": 48, "Science": 52, "English": 60, "Social Studies": 55, "Computer Science": 45 },
      attendanceHistory: [
        { date: "2026-06-18", status: "Absent" },
        { date: "2026-06-19", status: "Present" },
        { date: "2026-06-20", status: "Absent" },
        { date: "2026-06-21", status: "Absent" },
        { date: "2026-06-22", status: "Present" }
      ],
      schoolFeesStatus: { total: 1000, paid: 200, due: 800, status: "Overdue" }
    },
    {
      id: "std-4",
      name: "Li Na",
      rollNumber: "S2026-104",
      grade: "10-A",
      gender: "Female",
      parentName: "David Li",
      parentEmail: "david.li@example.com",
      parentPhone: "+86 10 12345678",
      attendanceRate: 96,
      riskLevel: "Low",
      grades: { "Mathematics": 98, "Science": 96, "English": 94, "Social Studies": 90, "Computer Science": 99 },
      attendanceHistory: [
        { date: "2026-06-18", status: "Present" },
        { date: "2026-06-19", status: "Present" },
        { date: "2026-06-20", status: "Present" },
        { date: "2026-06-21", status: "Present" },
        { date: "2026-06-22", status: "Present" }
      ],
      schoolFeesStatus: { total: 1200, paid: 1200, due: 0, status: "Paid" }
    },
    {
      id: "std-5",
      name: "Sana Mirza",
      rollNumber: "S2026-105",
      grade: "9-B",
      gender: "Female",
      parentName: "Bilal Mirza",
      parentEmail: "bilal.mirza@example.com",
      parentPhone: "+92 321 7654321",
      attendanceRate: 91,
      riskLevel: "Low",
      grades: { "Mathematics": 81, "Science": 85, "English": 88, "Social Studies": 84, "Computer Science": 80 },
      attendanceHistory: [
        { date: "2026-06-18", status: "Present" },
        { date: "2026-06-19", status: "Present" },
        { date: "2026-06-20", status: "Present" },
        { date: "2026-06-21", status: "Absent" },
        { date: "2026-06-22", status: "Present" }
      ],
      schoolFeesStatus: { total: 1000, paid: 1000, due: 0, status: "Paid" }
    }
  ];

  const defaultTeachers = [
    { id: "tch-1", name: "Dr. Sarah Jenkins", email: "sarah.jenkins@smartedu.edu", subject: "Mathematics", assignedGrades: ["10-A", "9-B"] },
    { id: "tch-2", name: "Prof. Kenneth Cole", email: "kenneth.cole@smartedu.edu", subject: "Science", assignedGrades: ["10-A", "9-B"] },
    { id: "tch-3", name: "Ms. Elena Rostova", email: "elena.rostova@smartedu.edu", subject: "English", assignedGrades: ["10-A", "9-B"] },
  ];

  const defaultLibraryBooks = [
    { id: "bk-1", title: "Introduction to Calculus", author: "James Stewart", isbn: "978-0538497817", category: "Mathematics", totalCopies: 10, issuedCopies: 4 },
    { id: "bk-2", title: "The Selfish Gene", author: "Richard Dawkins", isbn: "978-0198788607", category: "Science", totalCopies: 6, issuedCopies: 2 },
    { id: "bk-3", title: "A Brief History of Time", author: "Stephen Hawking", isbn: "978-0553380163", category: "Physics", totalCopies: 8, issuedCopies: 5 },
    { id: "bk-4", title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "978-0262033848", category: "Computer Science", totalCopies: 5, issuedCopies: 1 },
  ];

  const defaultTransportRoutes = [
    { id: "tr-1", routeName: "Dhow Road - Al Nahda Line", busNumber: "Bus 14A", driverName: "Mustafa Kamal", driverPhone: "+971 50 8881234", stops: ["Station A", "Al Nahda Park", "Community Center", "School Entrance"], studentCount: 15 },
    { id: "tr-2", routeName: "North Highway Loop", busNumber: "Bus 08B", driverName: "John Matthews", driverPhone: "+1 415 9876543", stops: ["North Gate", "Pine Valley", "Canyon Rd", "School Entrance"], studentCount: 12 },
  ];

  const defaultTimetable = [
    { id: "tt-1", grade: "10-A", day: "Monday", subject: "Mathematics", teacher: "Dr. Sarah Jenkins", timeSlot: "08:30 AM - 09:30 AM", room: "Room 101" },
    { id: "tt-2", grade: "10-A", day: "Monday", subject: "Science", teacher: "Prof. Kenneth Cole", timeSlot: "09:45 AM - 10:45 AM", room: "Lab 3" },
    { id: "tt-3", grade: "10-A", day: "Monday", subject: "English", teacher: "Ms. Elena Rostova", timeSlot: "11:00 AM - 12:00 PM", room: "Room 101" },
    { id: "tt-4", grade: "9-B", day: "Monday", subject: "Science", teacher: "Prof. Kenneth Cole", timeSlot: "08:30 AM - 09:30 AM", room: "Lab 3" },
    { id: "tt-5", grade: "9-B", day: "Monday", subject: "Mathematics", teacher: "Dr. Sarah Jenkins", timeSlot: "11:00 AM - 12:00 PM", room: "Room 102" }
  ];

  const defaultLogins = [
    { id: "log-1", userType: "teacher", targetId: "tch-1", targetName: "Dr. Sarah Jenkins", username: "sarah.jenkins", password: "Password123", status: "Active", assignedAt: "2026-06-22T10:00:00.000Z" },
    { id: "log-2", userType: "student", targetId: "std-1", targetName: "Aisha Rahman", username: "aisha.rahman", password: "Password123", status: "Active", assignedAt: "2026-06-22T10:01:00.000Z" },
    { id: "log-3", userType: "parent", targetId: "std-1", targetName: "Fatima Rahman", username: "fatima.rahman", password: "Password123", status: "Active", assignedAt: "2026-06-22T10:02:00.000Z" }
  ];

  let students: any[] = [];
  let teachers: any[] = [];
  let libraryBooks: any[] = [];
  let transportRoutes: any[] = [];
  let timetable: any[] = [];
  let lessonPlans: any[] = [];
  let generatedExams: any[] = [];
  let logins: any[] = [];

  function saveDb() {
    try {
      fs.writeFileSync(
        DB_PATH,
        JSON.stringify({
          students,
          teachers,
          libraryBooks,
          transportRoutes,
          timetable,
          lessonPlans,
          generatedExams,
          logins
        }, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("Failed to persist database state to storage disk:", err);
    }
  }

  function loadDb() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        students = parsed.students || [];
        teachers = parsed.teachers || [];
        libraryBooks = parsed.libraryBooks || [];
        transportRoutes = parsed.transportRoutes || [];
        timetable = parsed.timetable || [];
        lessonPlans = parsed.lessonPlans || [];
        generatedExams = parsed.generatedExams || [];
        logins = parsed.logins || [];
        console.log("School database successfully restored from disk storage.");
      } else {
        console.log("No persistent database detected. Creating initial school database records...");
        // Clone initial structures
        students = JSON.parse(JSON.stringify(defaultStudents));
        
        // Dynamic academic record / payment logging enrichment logic on initial seed
        students.forEach((student) => {
          const results: any[] = [];
          const subjects = ["Mathematics", "Science", "English", "Social Studies", "Computer Science"];
          
          const months = ["January", "February", "March", "April"];
          months.forEach((month, mIdx) => {
            subjects.forEach((subject) => {
              const baseScore = student.grades[subject] || 75;
              const variation = (mIdx * 3) - 5;
              const score = Math.max(40, Math.min(100, baseScore + variation));
              
              results.push({
                id: `ar-${student.id}-m-${month}-${subject}`,
                category: "Monthly",
                periodName: month,
                subject,
                score,
                maxMarks: 100,
                remarks: score >= 90 ? "Excellent understanding!" : score >= 75 ? "Consistent effort shown." : score >= 50 ? "Pass with room to improve." : "Needs core guidance.",
                loggedAt: new Date(2026, mIdx, 20).toISOString()
              });
            });
          });

          subjects.forEach((subject) => {
            const baseScore = student.grades[subject] || 75;
            const variation = -3;
            const score = Math.max(30, Math.min(100, baseScore + variation));
            results.push({
              id: `ar-${student.id}-midterm-${subject}`,
              category: "Midterm",
              periodName: "Midterm Examination",
              subject,
              score,
              maxMarks: 100,
              remarks: score >= 90 ? "Exceptional midterm performance!" : score >= 75 ? "Strong subject comprehension." : score >= 50 ? "Sufficient performance." : "Requires remediation plans.",
              loggedAt: new Date(2026, 4, 15).toISOString()
            });
          });

          subjects.forEach((subject) => {
            const baseScore = student.grades[subject] || 75;
            const variation = 2;
            const score = Math.max(35, Math.min(100, baseScore + variation));
            results.push({
              id: `ar-${student.id}-final-${subject}`,
              category: "Final Term",
              periodName: "Final Term Examination",
              subject,
              score,
              maxMarks: 100,
              remarks: score >= 90 ? "Mastery of topic achieved." : score >= 75 ? "Commendable completion." : score >= 50 ? "Passes academic requirements." : "Fails standards, summer tutoring advised.",
              loggedAt: new Date(2026, 5, 10).toISOString()
            });
          });

          student.academicResults = results;

          const paymentHistory: any[] = [];
          if (student.schoolFeesStatus.paid > 0) {
            const totalPaid = student.schoolFeesStatus.paid;
            const firstInstallment = Math.min(totalPaid, Math.round(student.schoolFeesStatus.total * 0.5));
            const secondInstallment = totalPaid - firstInstallment;

            paymentHistory.push({
              id: `pay-${student.id}-1`,
              amount: firstInstallment,
              method: "Bank Transfer",
              referenceNumber: `TXN${Math.floor(100000 + Math.random() * 900000)}BL`,
              paidAt: new Date(2026, 0, 10).toISOString(),
              remarks: "First Term Enrollment Installment"
            });

            if (secondInstallment > 0) {
              paymentHistory.push({
                id: `pay-${student.id}-2`,
                amount: secondInstallment,
                method: "Credit Card",
                referenceNumber: `TXN${Math.floor(100000 + Math.random() * 900000)}CC`,
                paidAt: new Date(2026, 2, 15).toISOString(),
                remarks: "Second Term Tuition Coverage"
              });
            }
          }
          student.schoolFeesStatus.paymentHistory = paymentHistory;
        });

        teachers = JSON.parse(JSON.stringify(defaultTeachers));
        libraryBooks = JSON.parse(JSON.stringify(defaultLibraryBooks));
        transportRoutes = JSON.parse(JSON.stringify(defaultTransportRoutes));
        timetable = JSON.parse(JSON.stringify(defaultTimetable));
        logins = JSON.parse(JSON.stringify(defaultLogins));

        saveDb();
      }
    } catch (error) {
      console.error("Failed to restore or seed databases from storage:", error);
    }
  }

  loadDb();

  // API 1: Fetch state representation
  app.get("/api/school/db", (req, res) => {
    res.json({
      students,
      teachers,
      libraryBooks,
      transportRoutes,
      timetable,
      lessonPlans,
      generatedExams,
      logins
    });
  });

  // API 2: Register Student
  app.post("/api/school/student/add", (req, res) => {
    const newStudent = req.body;
    newStudent.id = `std-${Date.now()}`;
    newStudent.attendanceRate = 100;
    newStudent.attendanceHistory = [{ date: new Date().toISOString().split("T")[0], status: "Present" }];
    students.push(newStudent);
    saveDb();
    res.json({ success: true, student: newStudent });
  });

  // API 2b: Assign a school login
  app.post("/api/school/login/assign", (req, res) => {
    const { userType, targetId, targetName, username, password } = req.body;
    
    // Check if login already exists for this targetId and userType
    const existingIndex = logins.findIndex(l => l.userType === userType && l.targetId === targetId);
    if (existingIndex !== -1) {
      logins[existingIndex].username = username;
      if (password) {
        logins[existingIndex].password = password;
      }
      logins[existingIndex].assignedAt = new Date().toISOString();
      saveDb();
      return res.json({ success: true, login: logins[existingIndex], action: "updated" });
    }

    const newLogin = {
      id: `log-${Date.now()}`,
      userType,
      targetId,
      targetName,
      username,
      password: password || "TempPass123!",
      status: "Active" as const,
      assignedAt: new Date().toISOString()
    };
    logins.push(newLogin);
    saveDb();
    res.json({ success: true, login: newLogin, action: "created" });
  });

  // API 2c: Toggle login status (Active vs Blocked)
  app.post("/api/school/login/toggle-status", (req, res) => {
    const { loginId } = req.body;
    const login = logins.find(l => l.id === loginId);
    if (login) {
      login.status = login.status === "Active" ? "Blocked" : "Active";
      saveDb();
      res.json({ success: true, login });
    } else {
      res.status(404).json({ error: "Login record not found" });
    }
  });

  // API 2d: Delete login credential
  app.post("/api/school/login/delete", (req, res) => {
    const { loginId } = req.body;
    const initialLength = logins.length;
    logins = logins.filter(l => l.id !== loginId);
    if (logins.length < initialLength) {
      saveDb();
      res.json({ success: true });
    } else {
      res.status(444).json({ error: "Login record not found" });
    }
  });

  // API 3: Update Student Attendance
  app.post("/api/school/attendance", (req, res) => {
    const { studentId, date, status } = req.body;
    const student = students.find((s) => s.id === studentId);
    if (student) {
      // Check if attendance already logged for this date
      const existingIdx = student.attendanceHistory.findIndex((h) => h.date === date);
      if (existingIdx !== -1) {
        student.attendanceHistory[existingIdx].status = status;
      } else {
        student.attendanceHistory.push({ date, status });
      }

      // Re-calculate Attendance Rate
      const totalDays = student.attendanceHistory.length;
      const presentCount = student.attendanceHistory.filter((h) => h.status === "Present").length;
      student.attendanceRate = Math.round((presentCount / totalDays) * 100);

      // Dropout risk recalculation
      if (student.attendanceRate < 70) {
        student.riskLevel = "High";
      } else if (student.attendanceRate < 85) {
        student.riskLevel = "Medium";
      } else {
        student.riskLevel = "Low";
      }

      saveDb();
      res.json({ success: true, student });
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  });

  // API 4: Log Grade
  app.post("/api/school/grades", (req, res) => {
    const { studentId, subject, score, category, periodName, remarks } = req.body;
    const student = students.find((s) => s.id === studentId);
    if (student) {
      const parsedScore = parseInt(score);
      student.grades[subject] = parsedScore;

      if (!student.academicResults) {
        student.academicResults = [];
      }

      // Find or create result
      const cat = category || "Monthly";
      const pn = periodName || "Current Month";

      const existingIndex = student.academicResults.findIndex(
        (r) => r.category === cat && r.periodName === pn && r.subject === subject
      );

      const newResult = {
        id: existingIndex !== -1 ? student.academicResults[existingIndex].id : `ar-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        category: cat,
        periodName: pn,
        subject,
        score: parsedScore,
        maxMarks: 100,
        remarks: remarks || "Logged via Gradebook Portal",
        loggedAt: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        student.academicResults[existingIndex] = newResult;
      } else {
        student.academicResults.push(newResult);
      }

      saveDb();
      res.json({ success: true, student });
    } else {
      res.status(404).json({ error: "Student not found" });
    }
  });

  // API 5: Library Book Issue/Return Toggle
  app.post("/api/school/book/toggle", (req, res) => {
    const { bookId, action } = req.body; // 'issue' or 'return'
    const book = libraryBooks.find((b) => b.id === bookId);
    if (book) {
      if (action === "issue" && book.issuedCopies < book.totalCopies) {
        book.issuedCopies++;
      } else if (action === "return" && book.issuedCopies > 0) {
        book.issuedCopies--;
      }
      saveDb();
      res.json({ success: true, book });
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  });

  // API 6: Apply Fee/Tuition Payment Remittance
  app.post("/api/school/fees/pay", (req, res) => {
    const { studentId, amount, method, remarks } = req.body;
    const student = students.find((s) => s.id === studentId);
    if (student) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Invalid payment amount specification." });
      }

      // Safeguard payment vs due
      const finalPaidAmount = Math.min(parsedAmount, student.schoolFeesStatus.due);

      student.schoolFeesStatus.paid = parseFloat((student.schoolFeesStatus.paid + finalPaidAmount).toFixed(2));
      student.schoolFeesStatus.due = parseFloat((student.schoolFeesStatus.total - student.schoolFeesStatus.paid).toFixed(2));

      if (student.schoolFeesStatus.due <= 0) {
        student.schoolFeesStatus.status = "Paid";
      } else if (student.schoolFeesStatus.paid > 0) {
        student.schoolFeesStatus.status = "Partial";
      } else {
        student.schoolFeesStatus.status = "Overdue";
      }

      if (!student.schoolFeesStatus.paymentHistory) {
        student.schoolFeesStatus.paymentHistory = [];
      }

      const paymentRecord = {
        id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        amount: finalPaidAmount,
        method: method || "Bank Transfer",
        referenceNumber: `TXN${Math.floor(100000 + Math.random() * 900000)}ONLINE`,
        paidAt: new Date().toISOString(),
        remarks: remarks || "Remitted through Portal Payment Gate"
      };

      student.schoolFeesStatus.paymentHistory.push(paymentRecord);

      saveDb();
      res.json({ success: true, student, paymentRecord });
    } else {
      res.status(404).json({ error: "Student profile not found" });
    }
  });

  // API 7: Update/Add Invoice Bills to Pupil
  app.post("/api/school/fees/update", (req, res) => {
    const { studentId, total, status } = req.body;
    const student = students.find((s) => s.id === studentId);
    if (student) {
      const parsedTotal = parseFloat(total);
      if (isNaN(parsedTotal) || parsedTotal < 0) {
        return res.status(400).json({ error: "Invalid tuition bill total specified." });
      }

      student.schoolFeesStatus.total = parsedTotal;
      student.schoolFeesStatus.due = parseFloat(Math.max(0, parsedTotal - student.schoolFeesStatus.paid).toFixed(2));

      if (status) {
        student.schoolFeesStatus.status = status;
      } else {
        if (student.schoolFeesStatus.due <= 0) {
          student.schoolFeesStatus.status = "Paid";
        } else if (student.schoolFeesStatus.paid > 0) {
          student.schoolFeesStatus.status = "Partial";
        } else {
          student.schoolFeesStatus.status = "Overdue";
        }
      }

      saveDb();
      res.json({ success: true, student });
    } else {
      res.status(404).json({ error: "Student profile not found" });
    }
  });

  // API 8: Register Course / Timetable Session
  app.post("/api/school/timetable/add", (req, res) => {
    const { grade, day, subject, teacher, timeSlot, room } = req.body;
    if (!grade || !day || !subject || !teacher || !timeSlot || !room) {
      return res.status(400).json({ error: "Missing required timetable registration parameters." });
    }
    const newEntry = {
      id: `tt-${Date.now()}`,
      grade,
      day,
      subject,
      teacher,
      timeSlot,
      room
    };
    timetable.push(newEntry);
    saveDb();
    res.json({ success: true, entry: newEntry });
  });

  // API 8b: AI Timetable Generator
  app.post("/api/school/timetable/generate", async (req, res) => {
    const { grade, action } = req.body; // grade: "10-A" | "9-B" | "All", action: "replace" | "append"
    
    // Fallback static realistic schedule in case Gemini API is offline/no key
    const getFallbackEntries = (selectedGrade: string) => {
      const gradesToGen = selectedGrade === "All" ? ["10-A", "9-B"] : [selectedGrade];
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
      const slots = [
        { timeSlot: "08:30 AM - 09:30 AM", roomMap: { "10-A": "Room 101", "9-B": "Room 102" } },
        { timeSlot: "09:45 AM - 10:45 AM", roomMap: { "10-A": "Lab 3", "9-B": "Room 102" } },
        { timeSlot: "11:00 AM - 12:00 PM", roomMap: { "10-A": "Room 101", "9-B": "Lab 3" } },
        { timeSlot: "01:00 PM - 02:00 PM", roomMap: { "10-A": "Room 103", "9-B": "Room 102" } }
      ];
      const subjectsMap = [
        { subject: "Mathematics", teacher: "Dr. Sarah Jenkins" },
        { subject: "Science", teacher: "Prof. Kenneth Cole" },
        { subject: "English", teacher: "Ms. Elena Rostova" },
        { subject: "Computer Science", teacher: "Ms. Elena Rostova" },
        { subject: "Social Studies", teacher: "Dr. Sarah Jenkins" }
      ];
      
      const generated: any[] = [];
      let idCounter = Date.now();
      
      gradesToGen.forEach((g) => {
        days.forEach((day, dayIdx) => {
          slots.forEach((slot, slotIdx) => {
            // Rotate subjects index to spread schedule
            const subIdx = (dayIdx + slotIdx + (g === "9-B" ? 2 : 0)) % subjectsMap.length;
            const subObj = subjectsMap[subIdx];
            generated.push({
              id: `tt-ai-${idCounter++}`,
              grade: g,
              day,
              subject: subObj.subject,
              teacher: subObj.teacher,
              timeSlot: slot.timeSlot,
              room: slot.roomMap[g as keyof typeof slot.roomMap] || "Room 101"
            });
          });
        });
      });
      return generated;
    };

    if (!ai) {
      const generated = getFallbackEntries(grade);
      if (action === "replace") {
        if (grade === "All") {
          timetable = generated;
        } else {
          timetable = timetable.filter(t => t.grade !== grade).concat(generated);
        }
      } else {
        timetable = timetable.concat(generated);
      }
      saveDb();
      return res.json({ success: true, count: generated.length, entries: generated, mode: "demo" });
    }

    try {
      const prompt = `Develop a logical, conflict-free school weekly timetable for the class grades: "${grade}" (options are '10-A' and '9-B', or 'All' to generate for all grades).
- Days allowed: Monday, Tuesday, Wednesday, Thursday, Friday.
- Timeslots allowed: "08:30 AM - 09:30 AM", "09:45 AM - 10:45 AM", "11:00 AM - 12:00 PM", "01:00 PM - 02:00 PM".
- Teachers and subjects alignment:
  * Dr. Sarah Jenkins teaches "Mathematics"
  * Prof. Kenneth Cole teaches "Science"
  * Ms. Elena Rostova teaches "English"
  * You can assign other subjects like "Computer Science" or "Social Studies" logically.
- Strictly make sure that on any given day and timeslot, a teacher is NOT double-booked for both Grade 10-A and Grade 9-B at the same time.
- Standard rooms are: 'Room 101' (10-A), 'Room 102' (9-B), 'Lab 3' (Science), 'Room 103' (Computer Science).
Generate a total roster covering everyday of the week with 4 lessons per day.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are a master academic registrar and institutional scheduler. You generate elegant, high-performance, clash-free timetables matching strict teacher schedules.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              entries: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    grade: { type: Type.STRING },
                    day: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    teacher: { type: Type.STRING },
                    timeSlot: { type: Type.STRING },
                    room: { type: Type.STRING }
                  },
                  required: ["grade", "day", "subject", "teacher", "timeSlot", "room"]
                }
              }
            },
            required: ["entries"]
          }
        }
      });

      const data = JSON.parse(response.text.trim());
      const entries = (data.entries || []).map((e: any, idx: number) => ({
        id: `tt-ai-${Date.now()}-${idx}`,
        ...e
      }));

      if (entries.length === 0) {
        throw new Error("No entries were generated by the AI model. Try again.");
      }

      if (action === "replace") {
        if (grade === "All") {
          timetable = entries;
        } else {
          timetable = timetable.filter(t => t.grade !== grade).concat(entries);
        }
      } else {
        timetable = timetable.concat(entries);
      }
      saveDb();
      res.json({ success: true, count: entries.length, entries, mode: "cognitive" });
    } catch (err: any) {
      console.error("AI scheduler error:", err);
      const generated = getFallbackEntries(grade);
      if (action === "replace") {
        if (grade === "All") {
          timetable = generated;
        } else {
          timetable = timetable.filter(t => t.grade !== grade).concat(generated);
        }
      } else {
        timetable = timetable.concat(generated);
      }
      saveDb();
      res.json({ success: true, count: generated.length, entries: generated, mode: "fallback-demomode" });
    }
  });

  // API 9: Remove Registered Course Session
  app.post("/api/school/timetable/delete", (req, res) => {
    const { id } = req.body;
    const originalLength = timetable.length;
    timetable = timetable.filter(entry => entry.id !== id);
    if (timetable.length < originalLength) {
      saveDb();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Course timetable entry not found." });
    }
  });

  // ================= GENERAL AI ASSISTANT CHATBOT =================
  app.post(["/api/gemini/chatbot", "/api/school/chatbot"], async (req, res) => {
    const { message, history } = req.body;
    if (!ai) {
      return res.json({
        text: "👋 Hello! I am running in Demowriting/No-API-Key mode. Here is a simulated response:\n\nIf you provide a valid Gemini API key in **Settings > Secrets**, I can instantly evaluate complex curriculum issues, solve STEM equations, plan classrooms, or consult rules. (Simulated Chat Response based on your query: '" + message + "')",
      });
    }

    try {
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `You are the chief AI School Ambassador and SmartEdu Assistant.
You support administrative staff, teachers, students, and parents at SmartEdu.
- Explain guidelines, Newton's laws, mathematics, or class scheduling queries simply.
- Assist students calmly as a patient interactive AI Tutor.
- Help parents quickly understand school fee structures or report comments.
Keep replies formatting in elegant, visual Markdown, and avoid technical metadata log dumps.`,
        },
      });

      // Simple chat loop manually recreating history or feeding it into Gemini history
      let currentResult = await chat.sendMessage({ message });
      res.json({ text: currentResult.text });
    } catch (err: any) {
      console.error("Gemini Assistant Chatbot Error:", err);
      res.status(500).json({ error: err.message || "An AI error occurred." });
    }
  });

  // ================= AI LESSON PLAN GENERATOR =================
  app.post(["/api/gemini/lesson-plan", "/api/school/lesson-plan"], async (req, res) => {
    const { subject, grade, topic } = req.body;
    if (!ai) {
      const demoPlan = {
        id: `lp-${Date.now()}`,
        teacherId: "tch-1",
        subject,
        grade,
        topic,
        createdAt: new Date().toISOString(),
        learningObjectives: [
          `Master core concept of ${topic} appropriate for ${grade}`,
          `Identify primary components and structural dependencies of ${subject}`,
          "Solve foundational assessments with high fluency"
        ],
        activities: [
          { duration: "10 mins", description: "Hook & Warm-up: Quick diagnostic inquiry on foundational knowledge." },
          { duration: "25 mins", description: "Direct Instruction & Concept Exploration: Step-by-step guidance, real-world analogies." },
          { duration: "15 mins", description: "Guided Practice & Group Challenge: Classroom workspace interactive exercises." }
        ],
        assessments: [
          "Peer review of collaborative challenge sheet",
          "Exit Ticket: Quick summary questionnaire"
        ],
        homework: `Read chapter text on ${topic}. Complete standard exercise sheet questions 1-5.`
      };
      lessonPlans.push(demoPlan);
      saveDb();
      return res.json({ result: demoPlan });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a structured syllabus lesson plan for Subject: "${subject}", Grade: "${grade}", Topic: "${topic}".`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an expert curriculum developer. Return a highly professional structural classroom lesson plan matching the grade's cognitive level.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              learningObjectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 3-4 concise learning objectives."
              },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    duration: { type: Type.STRING, description: "Time duration, e.g., '15 mins'" },
                    description: { type: Type.STRING, description: "Detailed description of active tutoring steps." }
                  },
                  required: ["duration", "description"]
                }
              },
              assessments: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Methods of checking for student mastery."
              },
              homework: { type: Type.STRING, description: "Topic-oriented assignment description." }
            },
            required: ["learningObjectives", "activities", "assessments", "homework"]
          }
        }
      });

      const parsed = JSON.parse(response.text.trim());
      const completePlan = {
        id: `lp-${Date.now()}`,
        teacherId: "tch-1",
        subject,
        grade,
        topic,
        createdAt: new Date().toISOString(),
        ...parsed
      };
      lessonPlans.push(completePlan);
      saveDb();
      res.json({ result: completePlan });
    } catch (err: any) {
      console.error("Gemini Lesson Plan Error:", err);
      res.status(500).json({ error: err.message || "AI Lesson Plan Generation Failed" });
    }
  });

  // ================= AI EXAM GENERATOR =================
  app.post(["/api/gemini/exam", "/api/school/exam"], async (req, res) => {
    const { 
      subject, 
      grade, 
      difficulty, 
      examTitle,
      numMcq = 5,
      numShort = 3,
      numLong = 2,
      marksMcq = 2,
      marksShort = 5,
      marksLong = 10
    } = req.body;

    if (!ai) {
      const demoQuestions: any[] = [];
      
      // Generate MCQs
      for (let i = 0; i < Number(numMcq); i++) {
        demoQuestions.push({
          type: "mcq",
          text: `Which of the following describes a key element or foundational concept of ${subject} (Topic Core ${i + 1})?`,
          options: ["The active hypothesis theory", "The kinetic balance option", "Dynamic constant metric evaluation", "Standard framework application"],
          answerKey: "The active hypothesis theory",
          marks: Number(marksMcq)
        });
      }

      // Generate Short Questions
      for (let i = 0; i < Number(numShort); i++) {
        demoQuestions.push({
          type: "short",
          text: `Describe a core real-world application of ${subject} academic principles in modern systems (Module ${i + 1}).`,
          answerKey: "Answer should trace key experimental models, identify qualitative factors, and reference direct evidence.",
          marks: Number(marksShort)
        });
      }

      // Generate Long Questions
      for (let i = 0; i < Number(numLong); i++) {
        demoQuestions.push({
          type: "long",
          text: `Critically analyze the strategic paradigm of ${subject}. Discuss its comparative advantages, theoretical foundations, and modern design challenges (Essay Question ${i + 1}).`,
          answerKey: "Evaluates standard structure, arguments matching theory, clarity of assumptions, and critical evaluation of design trade-offs.",
          marks: Number(marksLong)
        });
      }

      const demoExam = {
        id: `ex-${Date.now()}`,
        teacherId: "tch-1",
        subject,
        grade,
        difficulty,
        title: examTitle || `${subject} Core Assessment`,
        questions: demoQuestions,
        createdAt: new Date().toISOString()
      };
      generatedExams.push(demoExam);
      saveDb();
      return res.json({ result: demoExam });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a school quiz/exam with questions for Subject: "${subject}", Grade: "${grade}", Difficulty: "${difficulty}", Title: "${examTitle}". Output must contain:
- Exactly ${numMcq} Multiple Choice Questions (type: "mcq"), each worth exactly ${marksMcq} marks.
- Exactly ${numShort} Short-Answer Questions (type: "short"), each worth exactly ${marksShort} marks.
- Exactly ${numLong} Long-Answer/Essay Questions (type: "long"), each worth exactly ${marksLong} marks.

Generate realistic academic questions tailored to ${subject} class at Grade ${grade} level, adhering to ${difficulty} difficulty.`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an automated school assessment generator. Create scientifically sound classroom questions with their precise marks allocation and answer key. For 'mcq' type questions, include exactly 4 options. For 'short' and 'long' questions, do NOT include options, and provide a clear teacher rubric or expected response in answerKey.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "Must be exactly 'mcq', 'short', or 'long'." },
                    text: { type: Type.STRING, description: "Question prompt text." },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of 4 options if type is 'mcq'. Empty or undefined for short and long type."
                    },
                    answerKey: { type: Type.STRING, description: "Correct choice or grading criteria/teacher grading rubric." },
                    marks: { type: Type.INTEGER, description: "Marks allocated." }
                  },
                  required: ["type", "text", "answerKey", "marks"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      const parsed = JSON.parse(response.text.trim());
      const completeExam = {
        id: `ex-${Date.now()}`,
        teacherId: "tch-1",
        subject,
        grade,
        difficulty,
        title: examTitle || `${subject} Core Assessment`,
        questions: parsed.questions,
        createdAt: new Date().toISOString()
      };
      generatedExams.push(completeExam);
      saveDb();
      res.json({ result: completeExam });
    } catch (err: any) {
      console.error("Gemini Exam Generator Error:", err);
      res.status(500).json({ error: err.message || "AI Exam Generation Failed" });
    }
  });

  // ================= AI REPORT CARD COMMENT GENERATOR =================
  app.post(["/api/gemini/report-card", "/api/school/report-card"], async (req, res) => {
    const { studentId, commentsText } = req.body;
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (!ai) {
      return res.json({
        result: {
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          comments: `${student.name} demonstrates good performance. Keep up the consistent focus.`,
          strengths: ["Strong problem classification", "Excellent attendance logs"],
          weaknesses: ["Active participation in science seminars", "Occasional homework deadlines"],
          recommendations: ["Join mathematical peer-mentoring labs", "Consistent weekend practice"],
          generatedAt: new Date().toISOString()
        }
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a school report card evaluation and summary for student "${student.name}" (Grade ${student.grade}), based on attendance rate of ${student.attendanceRate}% and current grades: ${JSON.stringify(student.grades)}. Additional notes from teacher: "${commentsText || "Very regular"}".`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are an empathetic school educator generating report card performance comments. Balance realistic observations with highly motivational structure.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              comments: { type: Type.STRING, description: "Polished, paragraphs of teacher commentary." },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strengths observed." },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Areas for academic adjustment." },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific learning actions." }
            },
            required: ["comments", "strengths", "weaknesses", "recommendations"]
          }
        }
      });

      const parsed = JSON.parse(response.text.trim());
      res.json({
        result: {
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          ...parsed,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error("Gemini Report Card Comments Error:", err);
      res.status(500).json({ error: err.message || "AI Comment Generation Failed" });
    }
  });

  // ================= AI PERFORMANCE PREDICTION (EARLY WARNING SYSTEM) =================
  app.post(["/api/gemini/predict", "/api/school/predict"], async (req, res) => {
    const { studentId } = req.body;
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (!ai) {
      const dropoutProb = student.attendanceRate < 70 ? "High" : student.attendanceRate < 85 ? "Medium" : "Low";
      return res.json({
        result: {
          studentId: student.id,
          studentName: student.name,
          predictedScore: student.attendanceRate > 90 ? 88 : student.attendanceRate > 75 ? 72 : 54,
          dropoutRisk: dropoutProb,
          riskAnalysis: `Attendance pattern of ${student.attendanceRate}% constitutes a significant correlation factor. Score profile reflects subject gaps.`,
          improvementStrategies: [
            "Weekly counseling check-ins with advisory boards",
            "Individual student action plan for remedial help",
            "Establish active communication line with parental figures"
          ],
          lastUpdated: new Date().toISOString()
        }
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze academic risk level and performance forecast for Student: "${student.name}". Attendance: ${student.attendanceRate}%, Grades: ${JSON.stringify(student.grades)}. Evaluate risk of chronic failure or school dropout, and create active support strategies.`,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are a quantitative school risk analyst early-warning algorithm. Calculate predictive score projections and structured interventions based on current indicators.",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictedScore: { type: Type.INTEGER, description: "Forecasted average terminal exam score (0-100)." },
              dropoutRisk: { type: Type.STRING, description: "Must be exactly 'Low', 'Medium', or 'High'." },
              riskAnalysis: { type: Type.STRING, description: "Analytical cause-and-effect forecast." },
              improvementStrategies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific structured interventions." }
            },
            required: ["predictedScore", "dropoutRisk", "riskAnalysis", "improvementStrategies"]
          }
        }
      });

      const parsed = JSON.parse(response.text.trim());
      res.json({
        result: {
          studentId: student.id,
          studentName: student.name,
          ...parsed,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error("Gemini Performance Prediction Error:", err);
      res.status(500).json({ error: err.message || "AI Performance Prediction Failed" });
    }
  });

  // ================= AI PARENT COMMUNICATION MULTILINGUAL UPDATE =================
  app.post(["/api/gemini/parent-comm", "/api/school/parent-comm"], async (req, res) => {
    const { studentId, language } = req.body; // 'English' | 'Urdu' | 'Arabic' | etc.
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (!ai) {
      return res.json({
        result: `Dear parent (${student.parentName}), this is an official update regarding ${student.name}. Attendance rate is ${student.attendanceRate}% and grades average is consistent. (Demo Mode: Selected Language translation to ${language} will toggle with full Gemini API integration).`
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Compose and translate a formal, supportive school update letter to ${student.parentName} regarding their child ${student.name}. Language requested: "${language}". Include child's current attendance rate of ${student.attendanceRate}% and academic status. Status of school fees is: ${student.schoolFeesStatus.status}.`,
        config: {
          systemInstruction: `You are a multilingual family liaison counselor. Write beautiful, grammatically correct and warmly formal updates in the requested language. Do not output English if translating, output solely the letter in the chosen language (${language}).`,
        }
      });

      res.json({ result: response.text.trim() });
    } catch (err: any) {
      console.error("Gemini Family Liaison Error:", err);
      res.status(500).json({ error: err.message || "AI Family Liaison Generation Failed" });
    }
  });

  // ================= PRINCIPAL STRATEGIC RECOMMENDATIONS PLAN GENERATOR =================
  app.post("/api/get-strategic-plan", async (req, res) => {
    const { prompt } = req.body;
    if (!ai) {
      return res.status(400).json({ error: "No Gemini client configured" });
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert school management strategic advisor. Provide highly actionable executive advice on attendance, financials, and resource optimization based on diagnostic statistics."
        }
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini Strategic Plan Error:", err);
      res.status(500).json({ error: err.message || "Strategic plan generation failed" });
    }
  });

  // Vite Integration for Asset Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartEdu server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
