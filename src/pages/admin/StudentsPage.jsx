import { useState } from "react";
import { Search, Plus, Edit2, Trash2, CheckCircle } from "lucide-react";
import { Badge, Btn, Modal, Input, SelectField, ConfirmDialog, Toast } from "../../components/admin/ui.jsx";
import { CLASSES, TERMS, initials } from "../../utils/data.js";
import { studentApi } from "../../utils/api.js";

export default function StudentsPage({ students, reloadStudents, activeTerm, currentAdmin }) {
  const [search, setSearch]         = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [confirm, setConfirm]       = useState(null);
  const [toast, setToast]           = useState(null);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");
  const [regMode, setRegMode]       = useState("quick");
  const [form, setForm]             = useState({ fullName:"", email:"", phone:"", class:"", term: activeTerm });
  const [credentials, setCredentials] = useState(null);

  const isSuperAdmin = currentAdmin.role === "superadmin";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const filtered = students.filter(s =>
    (!search || s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
      s.regNumber.includes(search)) &&
    (!filterClass || s.class === filterClass)
  );

  const openAdd = () => {
    setForm({ fullName:"", email:"", phone:"", class:"", term: activeTerm });
    setRegMode("quick");
    setFormError("");
    setEditItem(null); setShowForm(true);
  };

  const openEdit = (s) => {
    setForm({ fullName: s.fullName, email: s.email || "", phone: s.phone || "", class: s.class, term: s.term });
    setFormError("");
    setEditItem(s); setShowForm(true);
  };

  const save = async () => {
    if (!form.fullName.trim() || !form.class) {
      setFormError("Name and class are required.");
      return;
    }
    if (regMode === "full" && !editItem && !form.email.trim()) {
      setFormError("Enter an email, or switch to \"No phone/email\" registration.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editItem) {
        await studentApi.update(editItem._id, form);
        showToast("Student updated.");
        setShowForm(false); setEditItem(null);
      } else {
        const payload = regMode === "quick" ? { ...form, email: "", phone: "" } : form;
        const res = await studentApi.create(payload);
        setShowForm(false);
        setCredentials({
          fullName: form.fullName,
          regNumber: res.regNumber || res.data?.regNumber,
          tempPassword: res.tempPassword,
          email: res.data?.email,
        });
      }
    } catch (err) {
      setFormError(err.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    try {
      await reloadStudents();
    } catch (err) {
  
      showToast(`Saved, but couldn't refresh the list: ${err.message}`, "error");
    }
  };

  const confirmDelete = (s) => setConfirm({ id: s._id, name: s.fullName });

  const doDelete = async () => {
    try {
      await studentApi.remove(confirm.id);
      showToast("Student removed.", "error");
    } catch (err) {
      showToast(err.message, "error");
      setConfirm(null);
      return;
    }
    setConfirm(null);
    try {
      await reloadStudents();
    } catch (err) {
      showToast(`Removed, but couldn't refresh the list: ${err.message}`, "error");
    }
  };

  const resetPassword = async (s) => {
    if (s.registrationType !== "admin") return;
    if (!window.confirm(`Generate a new password for "${s.fullName}"? Their old password will stop working.`)) return;
    try {
      const res = await studentApi.resetPassword(s._id);
      setCredentials({ fullName: s.fullName, regNumber: s.regNumber, tempPassword: res.tempPassword });
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div>
      <div className="filter-bar">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input className="search-input" placeholder="Search by name, email or reg number…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        {isSuperAdmin && (
          <Btn icon={<Plus size={14} />} onClick={openAdd}>Add Student</Btn>
        )}
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                {["Student","Email","Class","Reg. Number","Actions"].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap: 10 }}>
                      <div className="avatar sm">{initials(s.fullName)}</div>
                      <div>
                        <div className="tbl-name">{s.fullName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.email || <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                  <td><Badge color="purple">{s.class}</Badge></td>
                  <td><span className="code-chip">{s.regNumber}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => openEdit(s)}>
                        <Edit2 size={13} /> Edit
                      </button>
                      {s.registrationType === "admin" ? (
                        <button className="btn btn-ghost btn-sm" title="Reset password" onClick={() => resetPassword(s)}>
                          Reset Password
                        </button>
                      ) : (
                        <span style={{ fontSize: 11.5, color: "var(--text-faint)", fontStyle: "italic" }}>
                          Self-registered
                        </span>
                      )}
                      {isSuperAdmin && (
                        <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => confirmDelete(s)}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon"><Search size={22} /></div>
              <h4>No students found</h4>
              <p>Try a different search term or class filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <Modal
          title={editItem ? "Edit Student" : "Register New Student"}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          footer={
            <>
              <Btn variant="ghost" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : editItem ? "Save Changes" : "Register Student"}</Btn>
            </>
          }
        >
          {formError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              {formError}
            </div>
          )}

          {!editItem && (
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <button
                type="button"
                className={`btn btn-sm ${regMode === "quick" ? "" : "btn-ghost"}`}
                onClick={() => setRegMode("quick")}
                style={{ flex:1 }}
              >
                No phone / email
              </button>
              <button
                type="button"
                className={`btn btn-sm ${regMode === "full" ? "" : "btn-ghost"}`}
                onClick={() => setRegMode("full")}
                style={{ flex:1 }}
              >
                Has email
              </button>
            </div>
          )}

          <Input label="Full Name" required placeholder="e.g. Okeke Anthony" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />

          {(editItem || regMode === "full") && (
            <>
              <Input label="Email Address" required={regMode === "full" && !editItem} type="email" placeholder="student@school.edu (optional)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <Input label="Phone Number" placeholder="08012345678 (optional)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </>
          )}

          <SelectField label="Class" required value={form.class} onChange={e => setForm({...form, class: e.target.value})}>
            <option value="">Select class…</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </SelectField>
          <SelectField label="Term" value={form.term} onChange={e => setForm({...form, term: e.target.value})}>
            {TERMS.map(t => <option key={t}>{t}</option>)}
          </SelectField>

          {!editItem && (
            <div style={{ background:"var(--green-light)", borderRadius:"var(--radius-md)", padding: 12, fontSize: 13, color: "var(--green-dark)", display:"flex", gap:8, alignItems:"flex-start" }}>
              <CheckCircle size={15} style={{ flexShrink:0, marginTop:1 }} />
              {regMode === "quick"
                ? "A registration number AND a password will be generated automatically — they'll be shown right after you save so you can share them with the student. Only an admin can change this password later."
                : "A registration number and password will be generated automatically for this student."}
            </div>
          )}
        </Modal>
      )}

      {credentials && (
        <Modal
          title="Share these credentials"
          onClose={() => setCredentials(null)}
          footer={<Btn onClick={() => setCredentials(null)}>Done</Btn>}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
            Share these with <strong>{credentials.fullName}</strong>{credentials.email ? ` (also emailed to ${credentials.email})` : ""}.
            This won't be shown again — only an admin can generate a new one.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>Registration Number</div>
              <div style={{ background:"var(--bg)", border:"1.5px dashed var(--border-mid)", borderRadius:8, padding:"12px 16px", fontFamily:"monospace", fontSize:16, fontWeight:700, textAlign:"center", letterSpacing:1 }}>
                {credentials.regNumber}
              </div>
            </div>
            {credentials.tempPassword && (
              <div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>Password</div>
                <div style={{ background:"var(--bg)", border:"1.5px dashed var(--border-mid)", borderRadius:8, padding:"12px 16px", fontFamily:"monospace", fontSize:16, fontWeight:700, textAlign:"center", letterSpacing:1 }}>
                  {credentials.tempPassword}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message="Remove this student?"
          detail={`"${confirm.name}" will be permanently removed from the system.`}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}
