import React from "react";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart2,
  History,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import "../../css/students/Sidebar.css";
import { Logo, SchoolName } from "../common/Branding.jsx";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", view: "dashboard" },
  { icon: ClipboardList, label: "Available Exams", view: "exams" },
  { icon: BarChart2, label: "My Results", view: "results" },
  { icon: History, label: "Exam History", view: "history" },
  { icon: User, label: "My Profile", view: "profile" },
];

export default function Sidebar({
  student,
  activeView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onLogout,
  mobileOpen,
  onMobileClose,
}) {
  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}${mobileOpen ? " sidebar--mobile-open" : ""}`}
    >
      {/* Brand */}
      <div className='sidebar__brand'>
        <div className='sidebar__logo-circle'>
          <Logo size={22} rounded={8} />
        </div>
        {!collapsed && (
          <div className='sidebar__brand-text'>
            <div className='sidebar__school-name'>
              <SchoolName />
            </div>
          </div>
        )}

        {mobileOpen && (
          <button
            className='sidebar__mobile-close'
            onClick={onMobileClose}
            aria-label='Close menu'
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className='sidebar__nav'>
        {NAV_ITEMS.map(({ icon: Icon, label, view }) => (
          <button
            key={view}
            className={`sidebar__nav-item${activeView === view ? " sidebar__nav-item--active" : ""}`}
            onClick={() => onNavigate(view)}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse button */}
      <button className='sidebar__collapse-btn' onClick={onToggleCollapse}>
        {collapsed ? (
          <ChevronRight size={16} />
        ) : (
          <>
            <ChevronLeft size={16} />
            <span>Collapse</span>
          </>
        )}
      </button>

      {/* Bottom */}
      {!collapsed && (
        <div className='sidebar__bottom'>
          <div className='sidebar__student-card'>
            <div className='sidebar__avatar'>{student.fullName.charAt(0)}</div>
            <div className='sidebar__student-info'>
              <div className='sidebar__student-name'>{student.fullName}</div>
              <div className='sidebar__student-class'>{student.class}</div>
            </div>
          </div>
          <button className='sidebar__logout-btn' onClick={onLogout}>
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      )}

      {collapsed && (
        <div className='sidebar__bottom sidebar__bottom--collapsed'>
          <div className='sidebar__avatar sidebar__avatar--sm'>
            {student.fullName.charAt(0)}
          </div>
          <button
            className='sidebar__logout-btn sidebar__logout-btn--icon'
            title='Log Out'
            onClick={onLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
