/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SchoolUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "principal" | "teacher" | "student" | "parent";
  avatar?: string;
  details?: string;
}

export interface LoginCredential {
  id: string;
  userType: "teacher" | "student" | "parent";
  targetId: string;
  targetName: string;
  username: string;
  password?: string;
  status: "Active" | "Blocked";
  assignedAt: string;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  grade: string;
  gender: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  attendanceRate: number; // e.g., 94 for 94%
  riskLevel: "Low" | "Medium" | "High";
  grades: {
    [subject: string]: number; // e.g., { Mathematics: 88, Science: 92 }
  };
  attendanceHistory: {
    date: string;
    status: "Present" | "Absent" | "Excused";
  }[];
  schoolFeesStatus: {
    total: number;
    paid: number;
    due: number;
    status: "Paid" | "Partial" | "Overdue";
    paymentHistory?: FeePayment[];
  };
  academicResults?: AcademicResult[];
}

export interface FeePayment {
  id: string;
  amount: number;
  method: "Credit Card" | "Bank Transfer" | "Cash" | "UPI" | "Mobile Wallet";
  referenceNumber: string;
  paidAt: string;
  remarks?: string;
}

export interface AcademicResult {
  id: string;
  category: "Monthly" | "Midterm" | "Final Term";
  periodName: string; // e.g., "January", "February", "Midterm", "Final Term"
  subject: string;
  score: number;
  maxMarks: number;
  remarks?: string;
  loggedAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  assignedGrades: string[];
  classTeacherOf?: string;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  subject: string;
  grade: string;
  topic: string;
  createdAt: string;
  learningObjectives: string[];
  activities: { duration: string; description: string }[];
  assessments: string[];
  homework: string;
}

export interface GeneratedExam {
  id: string;
  teacherId: string;
  subject: string;
  grade: string;
  difficulty: "Easy" | "Medium" | "Hard";
  title: string;
  questions: {
    type: "mcq" | "short" | "long";
    text: string;
    options?: string[];
    answerKey: string;
    marks: number;
  }[];
  createdAt: string;
}

export interface ReportCardComment {
  studentId: string;
  studentName: string;
  grade: string;
  comments: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface PerformancePrediction {
  studentId: string;
  studentName: string;
  predictedScore: number;
  dropoutRisk: "Low" | "Medium" | "High";
  riskAnalysis: string;
  improvementStrategies: string[];
  lastUpdated: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  issuedCopies: number;
}

export interface TransportRoute {
  id: string;
  routeName: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  stops: string[];
  studentCount: number;
}

export interface TimetableEntry {
  id: string;
  grade: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  subject: string;
  teacher: string;
  timeSlot: string;
  room: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "10-A", "9-B"
  section: string; // e.g., "A", "B"
  assignedSubjects: string[]; // Subject names or course names
  classTeacherId?: string; // Teacher ID
}

