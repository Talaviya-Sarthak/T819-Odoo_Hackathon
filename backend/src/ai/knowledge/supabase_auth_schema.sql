-- ====================================================================
-- TCS | CHARUSAT UNIVERSITY — Supabase User Info & Auth Schema
-- Run this script inside your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Create Users Table for Student & Faculty Registration
CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_no   TEXT        UNIQUE,
    full_name       TEXT        NOT NULL,
    email           TEXT        UNIQUE NOT NULL,
    password_hash   TEXT        NOT NULL,
    department      TEXT        DEFAULT 'Computer Engineering (CSPIT/DEPSTAR)',
    semester        INTEGER     DEFAULT 1,
    role            TEXT        DEFAULT 'student', -- 'student', 'faculty', 'admin'
    status          TEXT        DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ DEFAULT now(),
    last_login_at   TIMESTAMPTZ DEFAULT now()
);

-- 2. Create User Sessions Table (Tracks active chat sessions per student)
CREATE TABLE IF NOT EXISTS user_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
    session_id  TEXT        NOT NULL,
    title       TEXT        DEFAULT 'New Chat',
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for Ultra-Fast Login & Query Lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_enrollment_idx ON users(enrollment_no);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions(user_id);

-- 4. Sample Default Demo Student Account (Password: Charusat@2026)
INSERT INTO users (enrollment_no, full_name, email, password_hash, department, semester, role)
VALUES (
    '22DCS045',
    'Aarav Patel',
    'student@charusat.ac.in',
    'pbkdf2_sha256_charusat_hash_demo',
    'Computer Engineering (CSPIT/DEPSTAR)',
    6,
    'student'
)
ON CONFLICT (email) DO NOTHING;
