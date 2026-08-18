import React, { useState, useEffect } from "react";
import {
  // Bell,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Trophy,
  TrendingUp,
  FileText,
  Calendar,
  User,
  Mail,
  Hash,
  Award,
  Target,
  Menu,
} from "lucide-react";
import Sidebar from "../../components/students/Sidebar.jsx";
import BeginExamModal from "../../components/students/BeginExamModal.jsx";
import "../../css/students/StudentsDashboard.css";
import { examApi, resultApi, studentAuthApi } from "../../utils/api.js";
import { TERMS } from "../../utils/data.js";

function mapExam(e) {
  return {
    id: e._id,
    title: e.title,
    subject: e.subject,
    class: e.class,
    term: e.term,
    totalQuestions: e.questionCount ?? 0,
    durationMinutes: e.duration,
    type: e.type,
    status: "live", 
    instructions: e.instructions || [],
  };
}

function mapResult(r) {
  const graded = r.status === "graded";
  return {
    subject: r.exam?.subject || r.exam?.title || "Exam",
    date: r.submittedAt
      ? new Date(r.submittedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "—",
    score: graded ? `${r.totalScore} / ${r.totalMarks}` : null,
    pct: graded ? r.percentage : null,
    status: graded ? "Graded" : "Pending Marking",
  };
}

export default function StudentsDashboard({ student, onVerified, onLogout, onStudentUpdate }) {
  const [view, setView] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [examToBegin, setExamToBegin] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [exams, setExams] = useState([]);
  const [pastExams, setPastExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedTerm, setSelectedTerm] = useState("All Terms");
  const visibleExams = selectedTerm === "All Terms"
    ? exams
    : exams.filter((e) => e.term === selectedTerm);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const [examsRes, resultsRes] = await Promise.all([
          examApi.getAll(),
          resultApi.getAll(),
        ]);
        if (cancelled) return;
        const results = resultsRes.data || [];
        const takenExamIds = new Set(
          results.map((r) => (typeof r.exam === "object" ? r.exam?._id : r.exam))
        );
        const availableExams = (examsRes.data || [])
          .filter((e) => !takenExamIds.has(e._id))
          .map(mapExam);

        setExams(availableExams);
        setPastExams(results.map(mapResult));
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const liveExam = visibleExams[0] || null;
  const upcomingExams = visibleExams.slice(1);

  function handleBeginExam(exam) {
    setExamToBegin(exam);
    setShowModal(true);
  }

  return (
    <div className='dashboard'>
      {mobileNavOpen && (
        <div className='dashboard__mobile-overlay' onClick={() => setMobileNavOpen(false)} />
      )}
      <Sidebar
        student={student}
        activeView={view}
        onNavigate={(v) => { setView(v); setMobileNavOpen(false); }}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(v => !v)}
        onLogout={onLogout}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <main className='dashboard__main'>
        <header className='dashboard__topbar'>
          <div className='dashboard__topbar-left'>
            <button className='dashboard__mobile-menu-btn' onClick={() => setMobileNavOpen(v => !v)} title="Menu">
              <Menu size={20} />
            </button>
            <h1 className='dashboard__page-title'>
              {view === "dashboard"
                ? "Dashboard"
                : view === "exams"
                  ? "Available Exams"
                  : view === "results"
                    ? "My Results"
                    : view === "history"
                      ? "Exam History"
                      : "My Profile"}
            </h1>
          </div>
          <div className='dashboard__topbar-right'>
            <div className='dashboard__term-filter'>
              <Star size={14} />
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                title="Filter exams by term"
              >
                <option value='All Terms'>All Terms</option>
                {TERMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className='dashboard__topbar-user-info'>
              <div className='dashboard__topbar-user-name'>{student.fullName}</div>
              <div className='dashboard__topbar-user-class'>{student.class}</div>
            </div>
            <div className='dashboard__avatar-small'>
              {student.fullName.charAt(0)}
            </div>
          </div>
        </header>

        <div className='dashboard__content'>
          {loadError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              Couldn't load your exams/results: {loadError}
            </div>
          )}
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading…</div>
          ) : (
            <>
              {view === "dashboard" && (
                <DashboardView
                  student={student}
                  liveExam={liveExam}
                  pastExams={pastExams}
                  onBeginExam={handleBeginExam}
                />
              )}
              {view === "exams" && (
                <AvailableExamsView
                  exams={visibleExams}
                  onBeginExam={handleBeginExam}
                />
              )}
              {view === "results" && <ResultsView pastExams={pastExams} />}
              {view === "history" && <HistoryView pastExams={pastExams} />}
              {view === "profile" && <ProfileView student={student} onStudentUpdate={onStudentUpdate} />}
            </>
          )}
        </div>
      </main>

      {showModal && examToBegin && (
        <BeginExamModal
          student={student}
          exam={examToBegin}
          onClose={() => setShowModal(false)}
          onVerified={() => {
            setShowModal(false);
            onVerified && onVerified(examToBegin);
          }}
        />
      )}
    </div>
  );
}

// VIEW 1 — DASHBOARD
function DashboardView({ student, liveExam, pastExams, onBeginExam }) {
  const totalExams = pastExams.length;
  const graded = pastExams.filter((e) => e.status === "Graded").length;
  const pending = pastExams.filter((e) => e.status !== "Graded").length;
  const avgScore = Math.round(
    pastExams.filter((e) => e.pct).reduce((s, e) => s + e.pct, 0) /
      (pastExams.filter((e) => e.pct).length || 1),
  );

  return (
    <>
     

      {/* Stat cards */}
      <div className='dashboard__stats-row'>
        <StatCard
          icon={BookOpen}
          colorClass='stat-card--purple'
          label='Total Exams Taken'
          value={totalExams}
        />
        <StatCard
          icon={CheckCircle2}
          colorClass='stat-card--green'
          label='Results Released'
          value={graded}
        />
        <StatCard
          icon={AlertCircle}
          colorClass='stat-card--amber'
          label='Pending Marking'
          value={pending}
        />
        <StatCard
          icon={TrendingUp}
          colorClass='stat-card--blue'
          label='Average Score'
          value={`${avgScore}%`}
          small
        />
      </div>

      {/* Two-column bottom: active exam + calendar / todo */}
      <div className='dashboard__two-col'>
        {/* Left col */}
        <div className='dashboard__two-col-left'>
          {liveExam && (
            <section className='dashboard__section'>
              <SectionHeader
                title='Begin Exam'
                subtitle='An exam is available for your class right now'
              />
              <div className='dashboard__active-exam-card'>
                <div className='dashboard__ae-live'>
                  <span className='dashboard__live-dot' />
                  LIVE
                </div>
                <div className='dashboard__ae-info'>
                  <h3 className='dashboard__ae-subject'>{liveExam.subject}</h3>
                  <div className='dashboard__ae-meta'>
                    <MetaBadge
                      icon={BookOpen}
                      text={`${liveExam.totalQuestions} Questions`}
                    />
                    <MetaBadge
                      icon={Clock}
                      text={`${liveExam.durationMinutes} Minutes`}
                    />
                    <MetaBadge icon={Star} text={liveExam.term} />
                  </div>
                </div>
                <button
                  className='dashboard__begin-btn'
                  onClick={() => onBeginExam(liveExam)}
                >
                  <PlayCircle size={20} />
                  Begin Exam
                </button>
              </div>
            </section>
          )}

          {/* Recent results mini-table */}
          <section className='dashboard__section'>
            <SectionHeader
              title='Recent Results'
              subtitle='Your latest graded exams'
            />
            <div className='dashboard__table-wrap'>
              <table className='dashboard__table'>
                <thead>
                  <tr>
                    <th className='dashboard__th'>Subject</th>
                    <th className='dashboard__th'>Score</th>
                    <th className='dashboard__th'>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastExams.slice(0, 3).map((exam, i) => (
                    <tr key={i} className='dashboard__tr'>
                      <td className='dashboard__td dashboard__td--bold'>
                        {exam.subject}
                      </td>
                      <td className='dashboard__td dashboard__td--mono'>
                        {exam.score ?? "—"}
                      </td>
                      <td className='dashboard__td'>
                        <StatusBadge status={exam.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right col — Calendar + To-Do */}
        <div className='dashboard__two-col-right'>
          <MiniCalendar />
          <TodoList studentId={student?._id} />
        </div>
      </div>
    </>
  );
}

function AvailableExamsView({ exams, onBeginExam }) {
  const live = exams.filter((e) => e.status === "live");
  const upcoming = exams.filter((e) => e.status === "upcoming");

  return (
    <>
      {live.length > 0 && (
        <section className='dashboard__section'>
          <SectionHeader
            title='Live Now'
            subtitle='These exams are currently open — start immediately'
          />
          <div className='exams-grid'>
            {live.map((exam) => (
              <ExamCard key={exam.id} exam={exam} onBegin={onBeginExam} />
            ))}
          </div>
        </section>
      )}

      <section className='dashboard__section'>
        <SectionHeader
          title='Upcoming Exams'
          subtitle='Scheduled exams for your class — use the term filter above to narrow down'
        />
        {upcoming.length === 0 ? (
          <EmptyState message='No upcoming exams scheduled yet.' />
        ) : (
          <div className='exams-grid'>
            {upcoming.map((exam) => (
              <ExamCard key={exam.id} exam={exam} onBegin={onBeginExam} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ExamCard({ exam, onBegin }) {
  const isLive = exam.status === "live";
  return (
    <div className={`exam-card${isLive ? " exam-card--live" : ""}`}>
      <div className='exam-card__header'>
        <div className='exam-card__subject-icon'>
          <BookOpen size={20} color={isLive ? "var(--teal)" : "#6B7280"} />
        </div>
        {isLive ? (
          <span
            className='dashboard__ae-live'
            style={{ fontSize: "10px", padding: "3px 8px" }}
          >
            <span className='dashboard__live-dot' />
            LIVE
          </span>
        ) : (
          <span className='exam-card__upcoming-badge'>Upcoming</span>
        )}
      </div>
      <h3 className='exam-card__subject'>{exam.subject}</h3>
      <div className='exam-card__meta'>
        <div className='exam-card__meta-item'>
          <Clock size={13} />
          {exam.durationMinutes} mins
        </div>
        <div className='exam-card__meta-item'>
          <FileText size={13} />
          {exam.totalQuestions} questions
        </div>
        <div className='exam-card__meta-item'>
          <Star size={13} />
          {exam.term}
        </div>
      </div>
      {isLive ? (
        <button
          className='dashboard__begin-btn'
          style={{ width: "100%", justifyContent: "center", marginTop: "14px" }}
          onClick={() => onBegin(exam)}
        >
          <PlayCircle size={16} />
          Start Exam
        </button>
      ) : (
        <div className='exam-card__soon'>Opens soon</div>
      )}
    </div>
  );
}

function ResultsView({ pastExams }) {
  const graded = pastExams.filter((e) => e.pct !== null);
  const avg = graded.length
    ? Math.round(graded.reduce((s, e) => s + e.pct, 0) / graded.length)
    : 0;
  const best = graded.length ? Math.max(...graded.map((e) => e.pct)) : 0;

  return (
    <>
      {/* Summary cards */}
      <div className='dashboard__stats-row'>
        <StatCard
          icon={Trophy}
          colorClass='stat-card--purple'
          label='Average Score'
          value={`${avg}%`}
          small
        />
        <StatCard
          icon={Award}
          colorClass='stat-card--green'
          label='Best Score'
          value={`${best}%`}
          small
        />
        <StatCard
          icon={CheckCircle2}
          colorClass='stat-card--blue'
          label='Graded Exams'
          value={graded.length}
        />
        <StatCard
          icon={Target}
          colorClass='stat-card--amber'
          label='Pending'
          value={pastExams.length - graded.length}
        />
      </div>

      <section className='dashboard__section'>
        <SectionHeader
          title='Score Breakdown'
          subtitle='Performance per subject'
        />
        <div className='results-cards'>
          {pastExams.map((exam, i) => (
            <div key={i} className='result-card'>
              <div className='result-card__left'>
                <div className='result-card__subject'>{exam.subject}</div>
                <div className='result-card__date'>{exam.date}</div>
              </div>
              <div className='result-card__right'>
                {exam.pct !== null ? (
                  <>
                    <div className='result-card__score'>{exam.score}</div>
                    <div className='result-card__bar-wrap'>
                      <div
                        className='result-card__bar'
                        style={{
                          width: `${exam.pct}%`,
                          background:
                            exam.pct >= 80
                              ? "#10B981"
                              : exam.pct >= 60
                                ? "#F59E0B"
                                : "#EF4444",
                        }}
                      />
                    </div>
                    <div
                      className='result-card__pct'
                      style={{
                        color:
                          exam.pct >= 80
                            ? "#10B981"
                            : exam.pct >= 60
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    >
                      {exam.pct}%
                    </div>
                  </>
                ) : (
                  <StatusBadge status={exam.status} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function HistoryView({ pastExams }) {
  return (
    <section className='dashboard__section'>
      <SectionHeader
        title='All Exams Taken'
        subtitle={`${pastExams.length} exam${pastExams.length !== 1 ? "s" : ""} on record`}
      />
      {pastExams.length === 0 ? (
        <EmptyState message="You haven't taken any exams yet." />
      ) : (
        <div className='dashboard__table-wrap'>
          <table className='dashboard__table'>
            <thead>
              <tr>
                <th className='dashboard__th'>S/N</th>
                <th className='dashboard__th'>Subject</th>
                <th className='dashboard__th'>Date</th>
                <th className='dashboard__th'>Score</th>
                <th className='dashboard__th'>Status</th>
              </tr>
            </thead>
            <tbody>
              {pastExams.map((exam, i) => (
                <tr key={i} className='dashboard__tr'>
                  <td className='dashboard__td dashboard__td--muted'>
                    {i + 1}
                  </td>
                  <td className='dashboard__td dashboard__td--bold'>
                    {exam.subject}
                  </td>
                  <td className='dashboard__td dashboard__td--muted'>
                    {exam.date}
                  </td>
                  <td className='dashboard__td dashboard__td--mono'>
                    {exam.score ?? "—"}
                  </td>
                  <td className='dashboard__td'>
                    <StatusBadge status={exam.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProfileView({ student, onStudentUpdate }) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(student.email);
  const [phone, setPhone] = useState(student.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const startEdit = () => {
    setEmail(student.email);
    setPhone(student.phone || "");
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
  };

  const save = async () => {
    setError("");
    setSuccess("");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const res = await studentAuthApi.updateMe({ email, phone });
      onStudentUpdate && onStudentUpdate(res.data);
      setSuccess("Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className='profile-hero'>
        <div className='profile-hero__avatar'>{student.fullName.charAt(0)}</div>
        <div>
          <div className='profile-hero__name'>{student.fullName}</div>
          <div className='profile-hero__class'>
            {student.class}
          </div>
        </div>
      </div>

      <section className='dashboard__section'>
        <SectionHeader
          title='Personal Information'
          subtitle={
            editing
              ? "Update your email or phone number below. Your name and class can only be changed by your Principal."
              : "Your registered details — you can update your email and phone yourself. Contact your Principal to change your name or class."
          }
        />

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && !editing && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
            {success}
          </div>
        )}

        <div className='dashboard__profile-card'>
          <ProfileRow icon={User} label='Full Name' value={student.fullName} />

          {editing ? (
            <div className='profile-row'>
              <div className='profile-row__icon'>
                <Mail size={15} color='var(--teal)' />
              </div>
              <span className='profile-row__label'>Email</span>
              <input
                type='email'
                style={{ maxWidth: 260, padding: "6px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : (
            <ProfileRow icon={Mail} label='Email' value={student.email} />
          )}

          {editing ? (
            <div className='profile-row'>
              <div className='profile-row__icon'>
                <Hash size={15} color='var(--teal)' />
              </div>
              <span className='profile-row__label'>Phone</span>
              <input
                type='tel'
                style={{ maxWidth: 260, padding: "6px 10px", fontSize: 13, border: "1px solid #e5e7eb", borderRadius: 6 }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='e.g. 08012345678'
              />
            </div>
          ) : (
            student.phone && <ProfileRow icon={Hash} label='Phone' value={student.phone} />
          )}

          <ProfileRow icon={BookOpen} label='Class' value={student.class} />
          {student.admissionNo && (
            <ProfileRow icon={FileText} label='Admission No.' value={student.admissionNo} mono />
          )}
          <ProfileRow icon={Hash} label='Registration Number' value={student.regNumber} mono />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {editing ? (
            <>
              <button className='dashboard__begin-btn' style={{ padding: "8px 18px" }} onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button className='dashboard__begin-btn' style={{ padding: "8px 18px", background: "transparent", color: "#6b7280", border: "1px solid #e5e7eb" }} onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
            </>
          ) : (
            <button className='dashboard__begin-btn' style={{ padding: "8px 18px" }} onClick={startEdit}>
              Edit Email / Phone
            </button>
          )}
        </div>
      </section>
    </>
  );
}

function MiniCalendar() {
  const today = new Date();
  const [cur, setCur] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const year = cur.getFullYear();
  const month = cur.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  // Fake exam event days
  const eventDays = [10, 18, 25];

  return (
    <div className='mini-calendar'>
      <div className='mini-calendar__header'>
        <button
          className='mini-calendar__nav'
          onClick={() => setCur(new Date(year, month - 1, 1))}
        >
          <ChevronLeft size={15} />
        </button>
        <span className='mini-calendar__month'>
          {MONTHS[month]} {year}
        </span>
        <button
          className='mini-calendar__nav'
          onClick={() => setCur(new Date(year, month + 1, 1))}
        >
          <ChevronRight size={15} />
        </button>
      </div>
      <div className='mini-calendar__grid'>
        {DAYS.map((d) => (
          <div key={d} className='mini-calendar__day-label'>
            {d}
          </div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`mini-calendar__cell${d === null ? " mini-calendar__cell--empty" : ""}${isToday(d) ? " mini-calendar__cell--today" : ""}${eventDays.includes(d) ? " mini-calendar__cell--event" : ""}`}
          >
            {d}
            {eventDays.includes(d) && d !== null && (
              <span className='mini-calendar__dot' />
            )}
          </div>
        ))}
      </div>
      <div className='mini-calendar__legend'>
        <span className='mini-calendar__legend-dot' />
        <span>Exam scheduled</span>
      </div>
    </div>
  );
}

function todoStorageKey(studentId) {
  return `cbt_student_todos_${studentId || "anon"}`;
}

function loadTodos(studentId) {
  try {
    const raw = localStorage.getItem(todoStorageKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(studentId, todos) {
  try {
    localStorage.setItem(todoStorageKey(studentId), JSON.stringify(todos));
  } catch {
   
  }
}

function TodoList({ studentId }) {
  const [todos, setTodos] = useState(() => loadTodos(studentId));
  const [input, setInput] = useState("");

  useEffect(() => {
    saveTodos(studentId, todos);
  }, [todos, studentId]);

  function add() {
    const text = input.trim();
    if (!text) return;
    setTodos((t) => [...t, { id: Date.now(), text, done: false }]);
    setInput("");
  }

  function toggle(id) {
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }
  function remove(id) {
    setTodos((t) => t.filter((x) => x.id !== id));
  }

  return (
    <div className='todo-widget'>
      <div className='todo-widget__header'>
        <span className='todo-widget__title'>Study To-Do</span>
       
      </div>

      <div className='todo-widget__input-row'>
        <input
          className='todo-widget__input'
          placeholder='Add a task…'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className='todo-widget__add-btn' onClick={add}>
          <Plus size={16} />
        </button>
      </div>

      <ul className='todo-widget__list'>
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`todo-item${todo.done ? " todo-item--done" : ""}`}
          >
            <button
              className='todo-item__check'
              onClick={() => toggle(todo.id)}
            >
              {todo.done && <CheckCircle2 size={15} color='#10B981' />}
              {!todo.done && <div className='todo-item__circle' />}
            </button>
            <span className='todo-item__text'>{todo.text}</span>
            <button
              className='todo-item__delete'
              onClick={() => remove(todo.id)}
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
        {todos.length === 0 && (
          <li className='todo-item__empty'>All done!</li>
        )}
      </ul>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className='section-header'>
      <h2 className='section-header__title'>{title}</h2>
      {subtitle && <p className='section-header__sub'>{subtitle}</p>}
    </div>
  );
}

function StatCard({ icon: Icon, colorClass, label, value, small }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className='stat-card__icon-box'>
        <Icon size={22} color='#fff' />
      </div>
      <div className='stat-card__info'>
        <div
          className={`stat-card__value${small ? " stat-card__value--small" : ""}`}
        >
          {value}
        </div>
        <div className='stat-card__label'>{label}</div>
      </div>
    </div>
  );
}

function MetaBadge({ icon: Icon, text }) {
  return (
    <div className='meta-badge'>
      <Icon size={14} color='var(--teal)' />
      {text}
    </div>
  );
}

function StatusBadge({ status }) {
  const isGraded = status === "Graded";
  return (
    <span
      className={`status-badge ${isGraded ? "status-badge--graded" : "status-badge--pending"}`}
    >
      {status}
    </span>
  );
}

function ProfileRow({ icon: Icon, label, value, mono }) {
  return (
    <div className='profile-row'>
      <div className='profile-row__icon'>
        <Icon size={15} color='var(--teal)' />
      </div>
      <span className='profile-row__label'>{label}</span>
      <span
        className={`profile-row__value${mono ? " profile-row__value--mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyState({ message }) {
  return <div className='dashboard__empty'>{message}</div>;
}
