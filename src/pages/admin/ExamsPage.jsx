import { useState } from "react";
import {
  Plus, Edit2, Trash2, BookOpen, CheckCircle, Clock, Users,
  FileQuestion, Send, KeyRound, RefreshCw, Copy
} from "lucide-react";
import { Badge, Btn, Modal, Input, SelectField, Textarea, ConfirmDialog, Toast } from "../../components/admin/ui.jsx";
import { CLASSES, TERMS } from "../../utils/data.js";
import { examApi } from "../../utils/api.js";

export default function ExamsPage({ exams, reloadExams, activeTerm, setPage, currentAdmin, subjects }) {
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm]           = useState(defaultForm(activeTerm));
  const [codesModal, setCodesModal] = useState(null); // exam being viewed
  const [codesRows, setCodesRows]   = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [generating, setGenerating]     = useState(false);

  const isSuperAdmin = currentAdmin.role === "superadmin";
  const allowedSubs   = currentAdmin.subjects || [];
  const allowedCls    = currentAdmin.classes  || [];

  const subjectNames = (subjects || []).map(s => s.name);

  const visibleSubjects = isSuperAdmin ? subjectNames : subjectNames.filter(s => allowedSubs.includes(s));
  const visibleClasses  = isSuperAdmin ? CLASSES  : CLASSES.filter(c => allowedCls.includes(c));


  const visibleExams = isSuperAdmin
    ? exams
    : exams.filter(e => allowedSubs.includes(e.subject) && allowedCls.includes(e.class));

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const openAdd = () => {
    setForm(defaultForm(activeTerm));
    setFormError("");
    setEditItem(null); setShowForm(true);
  };

  const openEdit = (ex) => {
    setForm({
      title: ex.title, subject: ex.subject, class: ex.class, term: ex.term,
      duration: ex.duration, type: ex.type, status: ex.status,
      instructions: Array.isArray(ex.instructions) ? ex.instructions.join("\n") : (ex.instructions || ""),
    });
    setFormError("");
    setEditItem(ex); setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.subject || !form.class) {
      setFormError("Title, subject and class are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      ...form,
      instructions: form.instructions
        ? form.instructions.split("\n").map(s => s.trim()).filter(Boolean)
        : undefined,
    };
    try {
      if (editItem) {
        await examApi.update(editItem._id, payload);
        showToast("Exam updated.");
      } else {
        await examApi.create(payload);
        showToast("Exam created.");
      }
     
      setShowForm(false); setEditItem(null);
    } catch (err) {
      setFormError(err.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    try {
      await reloadExams();
    } catch (err) {
      showToast(`Saved, but couldn't refresh the list: ${err.message}`, "error");
    }
  };

  const confirmDelete = (ex) => setConfirm({ id: ex._id, title: ex.title });

  const doDelete = async () => {
    try {
      await examApi.remove(confirm.id);
      await reloadExams();
      showToast("Exam deleted.", "error");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setConfirm(null);
    }
  };

  const publishExam = async (ex) => {
    try {
      await examApi.update(ex._id, { status: "published" });
      await reloadExams();
      showToast("Exam published — students can now see it.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const openCodes = async (ex) => {
    setCodesModal(ex);
    setCodesLoading(true);
    try {
      const res = await examApi.getCodes(ex._id);
      setCodesRows(res.data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCodesLoading(false);
    }
  };

  const doGenerateCodes = async () => {
    setGenerating(true);
    try {
      const res = await examApi.generateCodes(codesModal._id);
      showToast(res.message);
      const refreshed = await examApi.getCodes(codesModal._id);
      setCodesRows(refreshed.data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    showToast("Code copied to clipboard.");
  };

  return (
    <div>
      <div className="page-heading">
        <span />
        <Btn icon={<Plus size={14} />} onClick={openAdd}>Create Exam</Btn>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
        {visibleExams.map(ex => (
          <div key={ex._id} className="exam-card">
            <div className="exam-card-header">
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 8 }}>
                  <span className="exam-card-title">{ex.title}</span>
                  <Badge color={ex.status === "published" ? "green" : "gray"}>{ex.status === "published" ? "Published" : "Draft"}</Badge>
                  {ex.type === "objectives+theory" && <Badge color="blue">Obj + Theory</Badge>}
                </div>
                <div className="exam-meta">
                  <span className="exam-meta-item"><BookOpen size={13} /> {ex.subject}</span>
                  <span className="exam-meta-item"><Users size={13} /> {ex.class}</span>
                  <span className="exam-meta-item"><Clock size={13} /> {ex.duration} min</span>
                  <span className="exam-meta-item"><FileQuestion size={13} /> {ex.questionCount ?? 0} questions</span>
                  <span className="exam-meta-item">{ex.term}</span>
                </div>
              </div>
              <div className="action-btns">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ex)} title="Edit exam">
                  <Edit2 size={13} /> Edit
                </button>
                <button className="btn btn-accent btn-sm" onClick={() => setPage("questions")} title="Manage questions">
                  <FileQuestion size={13} /> Questions
                </button>
                {ex.status !== "published" && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => publishExam(ex)}
                    title="Publish — students will be able to see this exam"
                  >
                    <Send size={13} /> Publish
                  </button>
                )}
                {ex.status === "published" && (
                  <button className="btn btn-ghost btn-sm" onClick={() => openCodes(ex)} title="Manage per-student access codes">
                    <KeyRound size={13} /> Codes
                  </button>
                )}
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => confirmDelete(ex)} title="Delete exam">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {ex.instructions?.length > 0 && (
              <div style={{ marginTop: 10, padding: "10px 14px", background:"var(--bg)", borderRadius:"var(--radius-md)", fontSize: 12.5, color:"var(--text-muted)", borderLeft:"3px solid var(--green-main)" }}>
                {ex.instructions.join(" · ")}
              </div>
            )}
          </div>
        ))}

        {visibleExams.length === 0 && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><FileQuestion size={24} /></div>
              <h4>No exams yet</h4>
              <p>Create your first exam to get started.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <Modal
          title={editItem ? "Edit Exam" : "Create New Exam"}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          footer={
            <>
              <Btn variant="ghost" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : editItem ? "Save Changes" : "Create Exam"}</Btn>
            </>
          }
        >
          {formError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              {formError}
            </div>
          )}
          {visibleSubjects.length === 0 && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              {isSuperAdmin
                ? "No subjects yet — add one in Settings before creating an exam."
                : "You don't have any subjects assigned to you yet — ask your principal to assign one in Settings."}
            </div>
          )}
          <Input label="Exam Title" required placeholder="e.g. Computer Science Mid-Term" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <SelectField label="Subject" required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
            <option value="">Select subject…</option>
            {visibleSubjects.map(s => <option key={s}>{s}</option>)}
          </SelectField>
          <SelectField label="Target Class" required value={form.class} onChange={e => setForm({...form, class: e.target.value})}>
            <option value="">Select class…</option>
            {visibleClasses.map(c => <option key={c}>{c}</option>)}
          </SelectField>
          <SelectField label="Term" value={form.term} onChange={e => setForm({...form, term: e.target.value})}>
            {TERMS.map(t => <option key={t}>{t}</option>)}
          </SelectField>
          <SelectField
            label="Exam Type"
            value={form.type}
            onChange={e => setForm({...form, type: e.target.value})}
            hint="Objectives+Theory enables both MCQ and written sections."
          >
            <option value="objectives">Objectives only (MCQ)</option>
            <option value="objectives+theory">Objectives + Theory</option>
            <option value="theory">Theory only</option>
          </SelectField>
          <Input
            label="Duration (minutes)"
            type="number" min="10" max="180"
            value={form.duration}
            onChange={e => setForm({...form, duration: +e.target.value})}
            hint="MCQ only: 30–45 min · Obj + Theory: 60–120 min"
          />
          <Textarea
            label="Instructions (optional, one per line)"
            placeholder={"Answer all questions.\nNo calculator allowed."}
            value={form.instructions}
            onChange={e => setForm({...form, instructions: e.target.value})}
            rows={3}
          />
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message="Delete this exam?"
          detail={`"${confirm.title}" and all its questions will be permanently deleted.`}
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {codesModal && (
        <Modal
          title={`Access Codes — ${codesModal.title}`}
          wide
          onClose={() => setCodesModal(null)}
          footer={
            <>
              <Btn variant="ghost" onClick={() => setCodesModal(null)}>Close</Btn>
              <Btn icon={<RefreshCw size={14} />} onClick={doGenerateCodes} disabled={generating}>
                {generating ? "Generating…" : "Generate Codes"}
              </Btn>
            </>
          }
        >
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 14 }}>
            Each student gets their own one-time code for this exam — sharing a code
            won't let someone else use it for a different exam. Click <strong>Generate Codes</strong> to
            hand out codes to any student in <strong>{codesModal.class}</strong> who doesn't have one yet
            (existing codes are never changed, so late registrants can be added safely at any time).
          </p>
          {codesLoading ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading…</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Code</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {codesRows.map(r => (
                    <tr key={r.studentId}>
                      <td className="tbl-name">{r.fullName}</td>
                      <td>{r.email}</td>
                      <td>
                        {r.code
                          ? <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700, letterSpacing: 1 }}>{r.code}</span>
                          : <Badge color="gray">Not generated</Badge>}
                      </td>
                      <td>
                        {r.code && (
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => copyCode(r.code)} title="Copy code">
                            <Copy size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {codesRows.length === 0 && (
                <div className="empty-state"><p>No students in this class yet.</p></div>
              )}
            </div>
          )}
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}

function defaultForm(term) {
  return { title:"", subject:"", class:"", term, duration: 30, type:"objectives", status:"draft", instructions:"" };
}
