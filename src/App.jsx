import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// ── Student pages ──
import StudentsAuth from "./pages/students/StudentsAuth";
import ForgotPassword from "./pages/students/ForgotPassword";
import StudentsDashboard from "./pages/students/StudentsDashboard";
import InstructionsPage from "./pages/students/Instruction";
import ExamPage from "./pages/students/Exam";

// ── Admin pages ──
import AdminLoginPage from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

import { studentAuthApi, adminAuthApi } from "./utils/api";

// ── Exam-flow persistence ──────────────────────────────────────────
// Keeps the student on the Instructions/Exam screen (instead of being
// bounced back to the dashboard) across an accidental or intentional
// page refresh. Scoped to sessionStorage (same lifetime as the login
// token) and namespaced per-student so switching accounts on the same
// browser can't leak one student's in-progress exam into another's.
function examFlowKey(studentId) {
  return `gfacbt_exam_flow_${studentId || "anon"}`;
}

function loadExamFlow(studentId) {
  try {
    const raw = sessionStorage.getItem(examFlowKey(studentId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveExamFlow(studentId, flow) {
  try {
    if (flow) sessionStorage.setItem(examFlowKey(studentId), JSON.stringify(flow));
    else sessionStorage.removeItem(examFlowKey(studentId));
  } catch {
    /* ignore (private mode, etc.) */
  }
}

function StudentFlow() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [view, setView] = useState("dashboard");
  const [activeExam, setActiveExam] = useState(null);
  const [flowRestored, setFlowRestored] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    studentAuthApi
      .me()
      .then((res) => {
        if (!cancelled) setStudent(res.data);
      })
      .catch(() => {
        // No valid session -- send them back to sign in.
        if (!cancelled) navigate("/", { replace: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Once we know who's logged in, restore any in-progress exam so a
  // refresh lands back on Instructions/Exam instead of the dashboard.
  useEffect(() => {
    if (!student || flowRestored) return;
    const saved = loadExamFlow(student._id);
    if (saved && saved.exam && (saved.view === "instructions" || saved.view === "exam")) {
      setActiveExam(saved.exam);
      setView(saved.view);
    }
    setFlowRestored(true);
  }, [student, flowRestored]);

  // Keep the saved flow in sync with the live view so later refreshes
  // stay accurate, and clear it once the student is back on the dashboard.
  useEffect(() => {
    if (!student || !flowRestored) return;
    if ((view === "instructions" || view === "exam") && activeExam) {
      saveExamFlow(student._id, { view, exam: activeExam });
    } else {
      saveExamFlow(student._id, null);
    }
  }, [student, flowRestored, view, activeExam]);

  if (loading || (student && !flowRestored)) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
          color: "#6b7280",
        }}
      >
        Loading your dashboard…
      </div>
    );
  }

  if (!student) return null;

  if (view === "instructions" && activeExam) {
    return (
      <InstructionsPage
        student={student}
        exam={activeExam}
        onStart={() => setView("exam")}
        onBack={() => setView("dashboard")}
      />
    );
  }

  if (view === "exam" && activeExam) {
    return (
      <ExamPage
        student={student}
        exam={activeExam}
        onFinish={() => {
          setActiveExam(null);
          setView("dashboard");
        }}
      />
    );
  }

  return (
    <StudentsDashboard
      student={student}
      onStudentUpdate={(updates) => setStudent((s) => ({ ...s, ...updates }))}
      onVerified={(exam) => {
        setActiveExam(exam);
        setView("instructions");
      }}
      onLogout={() => {
        saveExamFlow(student._id, null);
        studentAuthApi.logout().finally(() => navigate("/", { replace: true }));
      }}
    />
  );
}

function AdminFlow() {
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  useEffect(() => {
    let cancelled = false;
    adminAuthApi
      .me()
      .then((res) => {
        if (!cancelled) setCurrentAdmin(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
          color: "#6b7280",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!currentAdmin) {
    return <AdminLoginPage onLogin={setCurrentAdmin} />;
  }

  return (
    <AdminDashboard
      currentAdmin={currentAdmin}
      onLogout={() => {
        adminAuthApi.logout().finally(() => setCurrentAdmin(null));
      }}
    />
  );
}

export default function App() {
  return (
    <Routes>
      {/* Student routes */}
      <Route path='/' element={<StudentsAuth />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/dashboard' element={<StudentFlow />} />

      {/* Admin routes */}
      <Route path='/admin' element={<AdminFlow />} />
    </Routes>
  );
}
