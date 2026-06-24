/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";

// Clean the provided project URL to ensure the base domain is used for Supabase client initialization
const rawUrl = "https://wnwdiasbotcfqgxtrqag.supabase.co/rest/v1/";
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").trim();
export const supabaseAnonKey = "sb_publishable_ZENWrWLcXOh8fXNbPrjS_A_HS1ifYC6";

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Diagnostic helper to verify Supabase REST API connection
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        "apikey": supabaseAnonKey
      }
    });
    
    if (response.ok) {
      return {
        success: true,
        message: "Successfully synchronized with Supabase cloud gateway!"
      };
    } else {
      return {
        success: false,
        message: `Gateway responded with status: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * SQL Schema definition text for setting up Supabase table architecture.
 * This can be run with 1-click in the Supabase SQL Editor.
 */
export const SUPABASE_SQL_SCHEMA = `-- SmartEdu Academy Supabase Migration Schema
-- Copy and run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/wnwdiasbotcfqgxtrqag/sql/new)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roll_number TEXT UNIQUE NOT NULL,
  grade TEXT NOT NULL,
  gender TEXT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  attendance_rate NUMERIC DEFAULT 100,
  risk_level TEXT,
  grades JSONB DEFAULT '{}'::jsonb,
  attendance_history JSONB DEFAULT '[]'::jsonb,
  school_fees_status JSONB DEFAULT '{}'::jsonb,
  academic_results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  assigned_grades TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Library Books Table
CREATE TABLE IF NOT EXISTS library_books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  category TEXT,
  total_copies INTEGER DEFAULT 1,
  issued_copies INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
  id TEXT PRIMARY KEY,
  grade TEXT NOT NULL,
  day TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  room TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Transport Routes Table
CREATE TABLE IF NOT EXISTS transport_routes (
  id TEXT PRIMARY KEY,
  route_name TEXT NOT NULL,
  bus_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  stops TEXT[] DEFAULT '{}',
  student_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Lesson Plans Table
CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  topic TEXT NOT NULL,
  learning_objectives TEXT[] DEFAULT '{}',
  activities JSONB DEFAULT '[]'::jsonb,
  assessments TEXT[] DEFAULT '{}',
  homework TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create Generated Exams Table
CREATE TABLE IF NOT EXISTS generated_exams (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  title TEXT NOT NULL,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create Login Credentials Table
CREATE TABLE IF NOT EXISTS login_credentials (
  id TEXT PRIMARY KEY,
  user_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  status TEXT DEFAULT 'Active',
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create General App Store (Universal Fallback DB JSON Backup)
CREATE TABLE IF NOT EXISTS school_system_backups (
  id BIGSERIAL PRIMARY KEY,
  synced_by TEXT NOT NULL DEFAULT 'SuperAdmin',
  students_count INTEGER DEFAULT 0,
  teachers_count INTEGER DEFAULT 0,
  library_books_count INTEGER DEFAULT 0,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_system_backups ENABLE ROW LEVEL SECURITY;

-- Create direct open policies for easy prototyping
CREATE POLICY "Allow anonymous read access" ON students FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON students FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read access" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON teachers FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" ON library_books FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON library_books FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" ON timetable FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON timetable FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" ON transport_routes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON transport_routes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" ON lesson_plans FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON lesson_plans FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" ON generated_exams FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON generated_exams FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" ON login_credentials FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON login_credentials FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access" ON school_system_backups FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write access" ON school_system_backups FOR INSERT WITH CHECK (true);
`;
