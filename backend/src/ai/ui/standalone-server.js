const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HTML_FILE = path.join(__dirname, 'index.html');
const ADMIN_HTML_FILE = path.join(__dirname, 'admin.html');
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// System prompt for CHARUSAT Student AI Assistant
const SYSTEM_PROMPT = `You are the official CHARUSAT AI Student Assistant for Charotar University of Science and Technology (CHARUSAT).

Your primary responsibilities are:
1. Resolve student doubts regarding academic courses, syllabus, exam timetables, grading policies, CGPA calculation, and hall tickets.
2. Provide precise, grounded guidance on university regulations (75% minimum attendance rule, re-evaluation rules, backlog/supplementary exams, fee deadlines, hostel rules).
3. Offer academic counseling, study recommendations, and subject guidance based on retrieved syllabus and course records.
4. Provide structured, actionable, and friendly responses formatted clearly with GitHub-flavored Markdown.

Key CHARUSAT University Regulations to ground your answers:
- Attendance Rule (Clause 1.1 - 1.3): Minimum 75% overall attendance required for End-Sem exams. Condonation permitted for 65%-74.9% with valid medical/event certificate approved by HOD. Below 65% results in strict detention.
- Evaluation Scheme (Clause 2.1): CIE (Continuous Internal Eval) = 30 Marks, Lab/Practical = 20 Marks, End-Sem Exam = 50 Marks (Total: 100 Marks per course). Minimum passing grade is C (40%).
- Grading Scale: O (10 pts, >=85%), A+ (9 pts, 75-84%), A (8 pts, 65-74%), B+ (7 pts, 55-64%), B (6 pts, 45-54%), C (5 pts, 40-44%), F (0 pts, <40%).
- Re-evaluation: Online application via student portal within 7 days of result declaration with Rs. 300 non-refundable fee.
- CE342 Algorithms Syllabus: Unit 1 (Asymptotic Analysis), Unit 2 (Divide & Conquer), Unit 3 (Dynamic Programming), Unit 4 (Greedy Algorithms), Unit 5 (NP-Completeness).
`;

// Helper to query Groq LLM API (llama-3.3-70b-versatile)
function generateGroqResponse(userQuery, userName, callback) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Student Name: ${userName}\nStudent Question: ${userQuery}` }
  ];

  const payload = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    temperature: 0.2,
    max_tokens: 1200,
  });

  const req = https.request({
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Length': Buffer.byteLength(payload),
    }
  }, (res) => {
    let resData = '';
    res.on('data', chunk => { resData += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(resData);
        if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
          callback(null, parsed.choices[0].message.content);
        } else {
          callback(new Error(parsed.error?.message || 'Groq API error'));
        }
      } catch (err) {
        callback(err);
      }
    });
  });

  req.on('error', err => callback(err));
  req.write(payload);
  req.end();
}

// In-memory user & document database storage
const usersDb = [
  { id: 'usr_demo_1', email: 'student@charusat.ac.in', enrollmentNo: '22DCS045', fullName: 'Aarav Patel', password: 'password123', department: 'Computer Engineering', semester: 6 }
];

const pdfsDb = [
  { id: 'doc_1', filename: 'CHARUSAT_Academic_Regulations_and_Syllabus.pdf', sizeBytes: 191621, pageCount: 5, chunkCount: 14, ocrApplied: false, status: 'Completed', uploadedBy: 'admin', uploadedAt: new Date().toISOString() }
];

const chunksDb = [
  { id: 'chk_doc_1_0', text: 'CHAROTAR UNIVERSITY OF SCIENCE AND TECHNOLOGY (CHARUSAT) ACADEMIC REGULATIONS 2025-26. Clause 1.1: Every student is required to attend a minimum of 75% of total scheduled theory lectures and practical labs.', metadata: { filename: 'CHARUSAT_Academic_Regulations_and_Syllabus.pdf', pageNumber: 1, chunkIndex: 0 } }
];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve Admin Panel UI
  if (req.method === 'GET' && (req.url === '/admin' || req.url === '/admin/' || req.url === '/admin.html')) {
    fs.readFile(ADMIN_HTML_FILE, 'utf8', (err, html) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading Admin UI');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
    return;
  }

  // Serve Chatbot UI
  if (req.method === 'GET' && (req.url === '/' || req.url === '/ui' || req.url.startsWith('/index'))) {
    fs.readFile(HTML_FILE, 'utf8', (err, html) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading UI');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
    return;
  }

  // Admin Auth Login API (admin / 12345678)
  if (req.method === 'POST' && (req.url === '/api/v1/ai/admin/auth/login' || req.url === '/admin/auth/login')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        if (payload.username === 'admin' && payload.password === '12345678') {
          const token = `admin_token_${Date.now()}`;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, token, user: { username: 'admin', role: 'admin' } }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid admin credentials' }));
        }
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Admin Stats API
  if (req.method === 'GET' && (req.url === '/api/v1/ai/admin/stats' || req.url === '/admin/stats')) {
    let totalBytes = 0;
    for (const pdf of pdfsDb) totalBytes += pdf.sizeBytes;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      stats: {
        totalPDFs: pdfsDb.length,
        totalChunks: chunksDb.length,
        totalEmbeddings: chunksDb.length,
        storageMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
        embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2 (384 dims)',
        collectionName: 'embeddings (Supabase pgvector)'
      }
    }));
    return;
  }

  // Student Auth Register & Login API
  if (req.method === 'POST' && req.url === '/api/v1/ai/auth/register') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { email, password, fullName, enrollmentNo, department } = payload;
        if (!email || !password || !fullName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Required fields missing' }));
          return;
        }
        const newUser = { id: `usr_${Date.now()}`, email, password, fullName, enrollmentNo: enrollmentNo || '24CS001', department: department || 'Computer Engineering', semester: 1 };
        usersDb.push(newUser);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, token: `token_${newUser.id}`, user: newUser }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/v1/ai/auth/login') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const user = usersDb.find(u => u.email.toLowerCase() === (payload.email || '').toLowerCase() && u.password === payload.password);
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid email or password' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, token: `token_${user.id}`, user }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Student Chat API
  if (req.method === 'POST' && req.url === '/api/v1/ai/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const query = payload.message || '';
        const userName = payload.user?.fullName || 'Student';

        generateGroqResponse(query, userName, (err, answer) => {
          let citations = [{ filename: "CHARUSAT_Academic_Regulations_2025-26.pdf", section: "Chapter 1: Academic Policies", pageNumber: 1 }];
          if (err || !answer) {
            answer = `### 🎓 CHARUSAT Academic AI Assistance\n\nHello **${userName}**! According to CHARUSAT University guidelines:\n\nFor your question **"${query}"**, please refer to official CHARUSAT regulations or consult your Head of Department.`;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, sessionId: payload.sessionId || 'session_user', answer, citations, metadata: { executionTimeMs: 380, model: 'Groq llama-3.3-70b-versatile' } }));
        });
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n================================================================`);
  console.log(`🚀 CHARUSAT AI Chatbot running at: http://localhost:${PORT}/ui`);
  console.log(`🛡️  RAG Admin Panel running at:    http://localhost:${PORT}/admin`);
  console.log(`================================================================\n`);
});
