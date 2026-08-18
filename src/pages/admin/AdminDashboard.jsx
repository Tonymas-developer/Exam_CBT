import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  HelpCircle,
  BarChart2,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";

// ── CSS ──
import "../../css/admin/global.css";
import "../../css/admin/dashboard.css";

import { Logo, SchoolName } from "../../components/common/Branding.jsx";

import { TERMS, initials } from "../../utils/data.js";
import {
  studentApi,
  examApi,
  adminApi,
  subjectApi,
  caSettingApi,
} from "../../utils/api.js";

// ── Admin sub-pages ──
import DashboardPage from "./DashboardPage.jsx";
import StudentsPage from "./StudentsPage.jsx";
import ExamsPage from "./ExamsPage.jsx";
import QuestionsPage from "./QuestionsPage.jsx";
import ResultsPage from "./ResultsPage.jsx";
import AdminsPage from "./AdminsPage.jsx";
import SettingsPage from "./SettingsPage.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "students", label: "Students", icon: <Users size={18} /> },
  { id: "exams", label: "Exams", icon: <FileText size={18} /> },
  { id: "questions", label: "Questions", icon: <HelpCircle size={18} /> },
  { id: "results", label: "Results", icon: <BarChart2 size={18} /> },
  {
    id: "admins",
    label: "Manage Admins",
    icon: <Shield size={18} />,
    superOnly: true,
  },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

export default function AdminDashboard({ currentAdmin, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [activeTerm, setActiveTerm] = useState("1st Term");
  const [collapsed, setCollapsed] = useState(false);

  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [caSettings, setCaSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isSuperAdmin = currentAdmin.role === "superadmin";
  const navItems = NAV.filter((n) => !n.superOnly || isSuperAdmin);
  const pageLabel = navItems.find((n) => n.id === page)?.label || page;
  const avatar = initials(currentAdmin.name);
  const roleLabel = currentAdmin.role === "superadmin" ? "Admin" : "Teacher";

  const reloadStudents = useCallback(async () => {
    const res = await studentApi.getAll();
    setStudents(res.data || []);
  }, []);

  const reloadExams = useCallback(async (term) => {
    const res = await examApi.getAll(term ? { term } : {});
    setExams(res.data || []);
  }, []);

  const reloadAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    const res = await adminApi.getAll();
    setAdmins(res.data || []);
  }, [isSuperAdmin]);

  const reloadSubjects = useCallback(async () => {
    const res = await subjectApi.getAll();
    setSubjects(res.data || []);
  }, []);

  const reloadCaSettings = useCallback(async () => {
    const res = await caSettingApi.get();
    setCaSettings(res.data || null);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const tasks = [
        reloadStudents(),
        reloadExams(activeTerm),
        reloadSubjects(),
        reloadCaSettings(),
      ];
      if (isSuperAdmin) tasks.push(reloadAdmins());
      await Promise.all(tasks);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    reloadExams(activeTerm).catch((err) => setLoadError(err.message));
  }, [activeTerm]);

  return (
    <div className='admin-root'>
      {mobileNavOpen && (
        <div
          className='admin-mobile-overlay'
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <nav
        className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${mobileNavOpen ? "mobile-open" : ""}`}
      >
        <div className='admin-sidebar-top'>
          <Logo size={32} />
          {!collapsed && (
            <span className='admin-sidebar-title'>
              <SchoolName />
            </span>
          )}
          {mobileNavOpen && (
            <button
              className='admin-sidebar-mobile-close'
              onClick={() => setMobileNavOpen(false)}
              aria-label='Close menu'
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className='admin-sidebar-term'>
            <div className='admin-sidebar-term-label'>Active Term</div>
            <select
              className='admin-sidebar-term-select'
              value={activeTerm}
              onChange={(e) => setActiveTerm(e.target.value)}
            >
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className='admin-sidebar-nav'>
          {!collapsed && <div className='nav-section-label'>Main Menu</div>}
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${page === item.id ? "active" : ""}`}
              onClick={() => {
                setPage(item.id);
                setMobileNavOpen(false);
              }}
              title={collapsed ? item.label : undefined}
            >
              <span className='nav-icon'>{item.icon}</span>
              {!collapsed && <span className='nav-label'>{item.label}</span>}
              {!collapsed && page === item.id && (
                <span className='nav-indicator' />
              )}
            </button>
          ))}
        </div>

        <button
          className='admin-sidebar-collapse-btn'
          onClick={() => setCollapsed((v) => !v)}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </nav>

      {/* ── Main area ── */}
      <div className={`main-area ${collapsed ? "sidebar-collapsed" : ""}`}>
        <header className='topbar'>
          <div className='topbar-left'>
            <button
              className='admin-mobile-menu-btn'
              onClick={() => setMobileNavOpen((v) => !v)}
              title='Menu'
            >
              <Menu size={20} />
            </button>
            <div>
              <div className='topbar-crumb'>
                <SchoolName short /> · {activeTerm}
              </div>
              <div className='topbar-title'>{pageLabel}</div>
            </div>
          </div>
          <div className='topbar-right'>
            <div className='topbar-user'>
              <div className='topbar-user-info'>
                <div className='topbar-user-name'>{currentAdmin.name}</div>
                <div className='topbar-user-role'>{roleLabel}</div>
              </div>
              <div className='avatar'>{avatar}</div>
            </div>
            <button className='logout-btn' onClick={onLogout} title='Sign out'>
              <LogOut size={14} />{" "}
              <span className='logout-btn-label'>Sign out</span>
            </button>
          </div>
        </header>

        <main className='page-content'>
          {loadError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span>Couldn't load data from the server: {loadError}</span>
              <button
                onClick={loadAll}
                style={{
                  background: "#fff",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: 6,
                  padding: "5px 12px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
              Loading…
            </div>
          ) : (
            <>
              {page === "dashboard" && (
                <DashboardPage
                  students={students}
                  exams={exams}
                  activeTerm={activeTerm}
                  setPage={setPage}
                />
              )}
              {page === "students" && (
                <StudentsPage
                  students={students}
                  reloadStudents={reloadStudents}
                  activeTerm={activeTerm}
                  currentAdmin={currentAdmin}
                />
              )}
              {page === "exams" && (
                <ExamsPage
                  exams={exams}
                  reloadExams={() => reloadExams(activeTerm)}
                  activeTerm={activeTerm}
                  setPage={setPage}
                  currentAdmin={currentAdmin}
                  subjects={subjects}
                />
              )}
              {page === "questions" && (
                <QuestionsPage
                  exams={exams}
                  reloadExams={() => reloadExams(activeTerm)}
                />
              )}
              {page === "results" && (
                <ResultsPage
                  exams={exams}
                  currentAdmin={currentAdmin}
                  caSettings={caSettings}
                />
              )}
              {page === "admins" && isSuperAdmin && (
                <AdminsPage
                  admins={admins}
                  reloadAdmins={reloadAdmins}
                  subjects={subjects}
                />
              )}
              {page === "settings" && (
                <SettingsPage
                  activeTerm={activeTerm}
                  setActiveTerm={setActiveTerm}
                  subjects={subjects}
                  reloadSubjects={reloadSubjects}
                  isSuperAdmin={isSuperAdmin}
                  caSettings={caSettings}
                  reloadCaSettings={reloadCaSettings}
                  currentAdmin={currentAdmin}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
