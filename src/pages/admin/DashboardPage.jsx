import { FileText, Users, CheckSquare, FileEdit, Plus, Edit2, Trash2, BarChart2 } from "lucide-react";
import { StatCard, Badge, Btn } from "../../components/admin/ui.jsx";
import { initials } from "../../utils/data.js";

export default function DashboardPage({ students, exams, activeTerm, setPage }) {
  const published = exams.filter(e => e.status === "published");
  const drafts = exams.filter(e => e.status !== "published");

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Total Students"   value={students.length}   icon={<Users size={22} />}       color="green" />
        <StatCard label="Total Exams"      value={exams.length}      icon={<FileText size={22} />}    color="blue" />
        <StatCard label="Published Exams"  value={published.length}  icon={<CheckSquare size={22} />} color="purple" />
        <StatCard label="Draft Exams"      value={drafts.length}     icon={<FileEdit size={22} />}    color="amber" />
      </div>

      <div className="two-col-grid">
        {/* Recent exams */}
        <div className="card card-pad">
          <div className="page-heading" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 15 }}>Recent Exams — {activeTerm}</h2>
            <Btn small icon={<Plus size={13} />} onClick={() => setPage("exams")}>Create Exam</Btn>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {["Exam Title","Subject","Class","Questions","Status","Actions"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exams.slice(0, 8).map(ex => (
                  <tr key={ex._id}>
                    <td className="tbl-name">{ex.title}</td>
                    <td>{ex.subject}</td>
                    <td><Badge color="blue">{ex.class}</Badge></td>
                    <td>{ex.questionCount ?? 0}</td>
                    <td><Badge color={ex.status === "published" ? "green" : "gray"}>{ex.status === "published" ? "Published" : "Draft"}</Badge></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPage("exams")} title="Edit"><Edit2 size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPage("questions")} title="Questions"><BarChart2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {exams.length === 0 && (
              <div className="empty-state"><p>No exams yet.</p></div>
            )}
          </div>
        </div>

        {/* Recent students */}
        <div className="card card-pad">
          <div className="page-heading" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 15 }}>Recent Students</h2>
          </div>
          {students.slice(0, 5).map(s => (
            <div key={s._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div className="avatar sm" style={{ background: "var(--green-main)" }}>{initials(s.fullName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.fullName}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.class} · <span className="code-chip">{s.regNumber}</span></div>
              </div>
              <Badge color="purple">{s.class}</Badge>
            </div>
          ))}
          {students.length === 0 && (
            <div className="empty-state"><p>No students yet.</p></div>
          )}
          <div style={{ marginTop: 14 }}>
            <Btn small variant="ghost" onClick={() => setPage("students")}>View all students →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
