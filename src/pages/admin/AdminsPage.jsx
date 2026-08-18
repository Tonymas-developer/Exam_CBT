import { useState } from "react";
import { Plus, Edit2, Trash2, Shield, Info, Check, KeyRound } from "lucide-react";
import { Badge, Btn, Modal, Input, SelectField, ConfirmDialog, Toast } from "../../components/admin/ui.jsx";
import { CLASSES, initials } from "../../utils/data.js";
import { adminApi } from "../../utils/api.js";

export default function AdminsPage({ admins, reloadAdmins, subjects }) {
  const SUBJECTS = (subjects || []).map(s => s.name);
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");
  const [tempPwdInfo, setTempPwdInfo] = useState(null); 
  const [form, setForm]           = useState(defaultForm());

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const openAdd = () => { setForm(defaultForm()); setFormError(""); setEditItem(null); setShowForm(true); };

  const openEdit = (a) => {
    setForm({ name: a.name, email: a.email, role: a.role, subjects: [...(a.subjects||[])], classes: [...(a.classes||[])], status: a.status });
    setFormError("");
    setEditItem(a); setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) { setFormError("Name and email are required."); return; }
    setSaving(true);
    setFormError("");
    try {
      if (editItem) {
        await adminApi.update(editItem._id, {
          name: form.name, subjects: form.subjects, classes: form.classes,
          status: form.status, role: form.role,
        });
        showToast("Admin updated.");
        setShowForm(false); setEditItem(null);
      } else {
        const res = await adminApi.create({
          name: form.name, email: form.email, role: form.role,
          subjects: form.subjects, classes: form.classes,
        });
        setShowForm(false); setEditItem(null);
        setTempPwdInfo({ email: form.email, tempPassword: res.tempPassword });
      }
    } catch (err) {
      setFormError(err.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    try {
      await reloadAdmins();
    } catch (err) {
      
      showToast(`Saved, but couldn't refresh the list: ${err.message}`, "error");
    }
  };

  const confirmDelete = (a) => setConfirm({ id: a._id, name: a.name });
  const doDelete = async () => {
    try {
      await adminApi.remove(confirm.id);
      showToast("Admin removed.", "error");
    } catch (err) {
      showToast(err.message, "error");
      setConfirm(null);
      return;
    }
    setConfirm(null);
    try {
      await reloadAdmins();
    } catch (err) {
      showToast(`Removed, but couldn't refresh the list: ${err.message}`, "error");
    }
  };

  const resetPassword = async (a) => {
    try {
      const res = await adminApi.resetPassword(a._id);
      setTempPwdInfo({ email: a.email, tempPassword: res.tempPassword });
    } catch (err) {
      showToast(err.message, "error");
      return;
    }
    try {
      await reloadAdmins();
    } catch (err) {
      showToast(`Password reset, but couldn't refresh the list: ${err.message}`, "error");
    }
  };

  const toggleSub = (s) => {
    const has = form.subjects.includes(s);
    setForm({...form, subjects: has ? form.subjects.filter(x=>x!==s) : [...form.subjects, s]});
  };

  const toggleClass = (c) => {
    const has = form.classes.includes(c);
    setForm({...form, classes: has ? form.classes.filter(x=>x!==c) : [...form.classes, c]});
  };

  const allSubs  = form.subjects.length === SUBJECTS.length;
  const allCls   = form.classes.length  === CLASSES.length;

  return (
    <div>
      <div className="page-heading">
        <div style={{ background:"var(--green-light)", color:"var(--green-dark)", borderRadius:"var(--radius-md)", padding:"10px 14px", fontSize:13, display:"flex", gap:8, alignItems:"flex-start", flex:1, marginRight:20 }}>
          <Info size={15} style={{ flexShrink:0, marginTop:1 }} />
          Teeachers you register here get a temporary password to share with them. They'll set their own permanent password at first login. They can only manage exams for their assigned subjects and classes.
        </div>
        <Btn icon={<Plus size={14} />} onClick={openAdd}>Add Teacher</Btn>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {admins.map(a => (
          <div key={a._id} className="admin-card">
            <div className={`admin-avatar ${a.role === "superadmin" ? "super" : ""}`}>
              {initials(a.name)}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontWeight:700, color:"var(--text-dark)", fontSize:14 }}>{a.name}</span>
                <Badge color={a.role === "superadmin" ? "purple" : "blue"}>
                  {a.role === "superadmin" ? "Admin" : "Teacher"}
                </Badge>
                <Badge color={a.status === "active" ? "green" : "gray"}>{a.status}</Badge>
                {!a.hasSetPassword && <Badge color="amber">Pending first login</Badge>}
              </div>
              <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom: a.subjects?.length ? 8 : 0 }}>{a.email}</div>
              {a.subjects?.length > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {a.subjects.map(s => <Badge key={s} color="gray">{s}</Badge>)}
                </div>
              )}
              {a.classes?.length > 0 && a.role !== "superadmin" && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:5 }}>
                  {a.classes.map(c => <Badge key={c} color="blue">{c}</Badge>)}
                </div>
              )}
            </div>
            {a.role !== "superadmin" && (
              <div className="action-btns">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>
                  <Edit2 size={13} /> Edit
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => resetPassword(a)} title="Reset password">
                  <KeyRound size={13} /> Reset Password
                </button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => confirmDelete(a)} title="Remove admin">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        ))}
        {admins.length === 0 && (
          <div className="card"><div className="empty-state"><p>No teachers yet.</p></div></div>
        )}
      </div>

      {/* Add / Edit Admin Modal */}
      {showForm && (
        <Modal
          wide
          title={editItem ? "Edit Teacher" : "Register New Teacher"}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          footer={
            <>
              <Btn variant="ghost" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : editItem ? "Save Changes" : "Register Teacher"}</Btn>
            </>
          }
        >
          {formError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              {formError}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Input label="Full Name" required placeholder="Mr. Okeke Anthony" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <Input
              label="Email Address" required type="email" placeholder="ukaegbu15@gmail.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              disabled={!!editItem}
              hint={editItem ? "Email can't be changed after a teacher is created." : undefined}
            />
          </div>

          <SelectField label="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            <option value="teacher">Teacher (limited to assigned subjects & classes)</option>
            <option value="superadmin">Admin (full access)</option>
          </SelectField>

          <SelectField label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectField>

          {form.role === "teacher" && (
            <>
              <hr className="divider" />

              {/* Subjects */}
              <div className="fc-group">
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <label className="fc-label" style={{ margin:0 }}>Assigned Subjects</label>
                  <button className="btn btn-ghost btn-sm" onClick={() =>
                    setForm({...form, subjects: allSubs ? [] : [...SUBJECTS]})
                  }>{allSubs ? "Deselect all" : "Select all"}</button>
                </div>
                <div className="pill-group">
                  {SUBJECTS.map(s => (
                    <button
                      key={s}
                      className={`pill-tag ${form.subjects.includes(s) ? "selected" : ""}`}
                      onClick={() => toggleSub(s)}
                    >
                      {form.subjects.includes(s) && <Check size={11} />} {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Classes */}
              <div className="fc-group" style={{ marginTop:4 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <label className="fc-label" style={{ margin:0 }}>Assigned Classes</label>
                  <button className="btn btn-ghost btn-sm" onClick={() =>
                    setForm({...form, classes: allCls ? [] : [...CLASSES]})
                  }>{allCls ? "Deselect all" : "Select all"}</button>
                </div>
                <div className="class-grid">
                  {CLASSES.map(c => (
                    <button
                      key={c}
                      className={`class-check-item ${form.classes.includes(c) ? "selected" : ""}`}
                      onClick={() => toggleClass(c)}
                    >
                      <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${form.classes.includes(c) ? "var(--green-main)" : "var(--border-mid)"}`, background: form.classes.includes(c) ? "var(--green-main)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.12s" }}>
                        {form.classes.includes(c) && <Check size={10} color="#fff" strokeWidth={3} />}
                      </div>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!editItem && (
            <div style={{ background:"var(--green-light)", color:"var(--green-dark)", borderRadius:"var(--radius-md)", padding:"10px 14px", fontSize:13, display:"flex", gap:8, marginTop:8 }}>
              <Info size={15} style={{ flexShrink:0, marginTop:1 }} />
              A temporary password will be generated. You'll see it right after creating this teacher — share it with them securely.
            </div>
          )}
        </Modal>
      )}

     
      {tempPwdInfo && (
        <Modal
          title="Share these credentials"
          onClose={() => setTempPwdInfo(null)}
          footer={<Btn onClick={() => setTempPwdInfo(null)}>Done</Btn>}
        >
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
            Share this temporary password with <strong>{tempPwdInfo.email}</strong>. They'll be asked to set a permanent password on first login. This won't be shown again.
          </p>
          <div style={{ background:"var(--bg)", border:"1.5px dashed var(--border-mid)", borderRadius:8, padding:"14px 16px", fontFamily:"monospace", fontSize:18, fontWeight:700, textAlign:"center", letterSpacing:1 }}>
            {tempPwdInfo.tempPassword}
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message="Remove this admin?"
          detail={`"${confirm.name}" will lose all access to the system.`}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}

function defaultForm() {
  return { name:"", email:"", role:"teacher", subjects:[], classes:[], status:"active" };
}
