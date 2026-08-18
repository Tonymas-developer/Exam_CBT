import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, FileQuestion, CheckCircle } from "lucide-react";
import { Badge, Btn, Modal, Input, Textarea, SelectField, ConfirmDialog, Toast } from "../../components/admin/ui.jsx";
import { questionApi } from "../../utils/api.js";

export default function QuestionsPage({ exams, reloadExams }) {
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?._id || null);
  const [questions, setQuestions]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [loadError, setLoadError]           = useState("");

  const [showForm, setShowForm]             = useState(false);
  const [editItem, setEditItem]             = useState(null);
  const [confirm, setConfirm]               = useState(null);
  const [toast, setToast]                   = useState(null);
  const [saving, setSaving]                 = useState(false);
  const [formError, setFormError]           = useState("");
  const [form, setForm]                     = useState(defaultForm());

  const exam = exams.find(e => e._id === selectedExamId);
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);

  useEffect(() => {
    if (!selectedExamId) { setQuestions([]); return; }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const res = await questionApi.getByExam(selectedExamId);
        if (!cancelled) setQuestions(res.data || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedExamId]);

  const reloadQuestions = async () => {
    const res = await questionApi.getByExam(selectedExamId);
    setQuestions(res.data || []);
    await reloadExams(); 
  };

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const openAdd = () => { setForm(defaultForm()); setFormError(""); setEditItem(null); setShowForm(true); };

  const openEdit = (q) => {
    setForm({
      type: q.type,
      text: q.text,
      options: q.options?.length ? [...q.options, "", "", "", ""].slice(0, Math.max(4, q.options.length)) : ["","","",""],
      correctOption: q.correctOption ?? 0,
      marks: q.marks,
      theoryAnswer: q.theoryAnswer || "",
    });
    setFormError("");
    setEditItem(q); setShowForm(true);
  };

  const save = async () => {
    if (!form.text.trim()) { setFormError("Question text is required."); return; }
    if (form.type === "objective" && form.options.filter(o => o.trim()).length < 2) {
      setFormError("At least 2 options are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      examId: selectedExamId,
      type: form.type,
      text: form.text,
      marks: form.marks,
      ...(form.type === "objective"
        ? { options: form.options.filter(o => o.trim()), correctOption: form.correctOption }
        : { theoryAnswer: form.theoryAnswer }),
    };
    try {
      if (editItem) {
        await questionApi.update(editItem._id, payload);
        showToast("Question updated.");
      } else {
        await questionApi.create(payload);
        showToast("Question added.");
      }
      
      setShowForm(false); setEditItem(null);
    } catch (err) {
      setFormError(err.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    try {
      await reloadQuestions();
    } catch (err) {
      showToast(`Saved, but couldn't refresh the list: ${err.message}`, "error");
    }
  };

  const confirmDelete = (q) => setConfirm({ id: q._id });
  const doDelete = async () => {
    try {
      await questionApi.remove(confirm.id);
      showToast("Question removed.", "error");
    } catch (err) {
      showToast(err.message, "error");
      setConfirm(null);
      return;
    }
    setConfirm(null);
    try {
      await reloadQuestions();
    } catch (err) {
      showToast(`Removed, but couldn't refresh the list: ${err.message}`, "error");
    }
  };

  const setOption = (i, val) => {
    const o = [...form.options]; o[i] = val; setForm({...form, options: o});
  };

  const objQs    = questions.filter(q => q.type === "objective");
  const theoryQs = questions.filter(q => q.type === "theory");

  return (
    <div>
      {/* Exam selector */}
      <div className="filter-bar">
        <select
          className="filter-select"
          style={{ minWidth: 280 }}
          value={selectedExamId || ""}
          onChange={e => setSelectedExamId(e.target.value)}
        >
          {exams.map(ex => (
            <option key={ex._id} value={ex._id}>{ex.title} — {ex.class}</option>
          ))}
        </select>
        <div style={{ flex:1 }} />
        {exam && (
          <div style={{ fontSize: 13, color:"var(--text-muted)" }}>
            <strong>{questions.length}</strong> question{questions.length !== 1 ? "s" : ""} · <strong>{totalMarks}</strong> total marks
          </div>
        )}
        <Btn icon={<Plus size={14} />} onClick={openAdd} disabled={!selectedExamId}>Add Question</Btn>
      </div>

      {loadError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
          {loadError}
        </div>
      )}

      {loading && <div className="card"><div className="empty-state"><p>Loading questions…</p></div></div>}

      {!loading && exam && questions.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileQuestion size={24} /></div>
            <h4>No questions yet</h4>
            <p>Add your first question to this exam.</p>
          </div>
        </div>
      )}

      {!exams.length && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileQuestion size={24} /></div>
            <h4>No exams yet</h4>
            <p>Create an exam first, then come back here to add its questions.</p>
          </div>
        </div>
      )}

      {/* Objectives section */}
      {objQs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", color:"var(--text-muted)", marginBottom:12 }}>
            Objectives (MCQ) — {objQs.length} question{objQs.length !== 1 ? "s" : ""}
          </div>
          <div className="question-list">
            {objQs.map((q, i) => (
              <div key={q._id} className="q-card">
                <div className="q-card-header">
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <span className="q-number">Q{i+1}</span>
                    <Badge color="blue">MCQ</Badge>
                    <Badge color="gray">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="action-btns">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(q)} title="Edit"><Edit2 size={13} /></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => confirmDelete(q)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="q-text">{q.text}</div>
                <div className="mcq-grid">
                  {(q.options || []).map((opt, oi) => (
                    <div key={oi} className={`mcq-option ${oi === q.correctOption ? "correct" : ""}`}>
                      <span className="mcq-option-letter">{String.fromCharCode(65+oi)}.</span>
                      <span style={{ flex:1, fontSize:13 }}>{opt}</span>
                      {oi === q.correctOption && <CheckCircle size={14} style={{ color:"var(--green-main)", flexShrink:0 }} />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Theory section */}
      {theoryQs.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", color:"var(--text-muted)", marginBottom:12 }}>
            Theory — {theoryQs.length} question{theoryQs.length !== 1 ? "s" : ""}
          </div>
          <div className="question-list">
            {theoryQs.map((q, i) => (
              <div key={q._id} className="q-card">
                <div className="q-card-header">
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <span className="q-number">T{i+1}</span>
                    <Badge color="amber">Theory</Badge>
                    <Badge color="gray">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="action-btns">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(q)} title="Edit"><Edit2 size={13} /></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => confirmDelete(q)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="q-text">{q.text}</div>
                {q.theoryAnswer && (
                  <div style={{ background:"var(--green-pale)", border:"1px solid #bbf7d0", borderRadius:"var(--radius-md)", padding:"10px 14px", fontSize:13, color:"var(--green-dark)", marginTop:8 }}>
                    <strong>Model answer:</strong> {q.theoryAnswer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Question Modal */}
      {showForm && (
        <Modal
          title={editItem ? "Edit Question" : "Add Question"}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          footer={
            <>
              <Btn variant="ghost" onClick={() => { setShowForm(false); setEditItem(null); }}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : editItem ? "Save Changes" : "Add Question"}</Btn>
            </>
          }
        >
          {formError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              {formError}
            </div>
          )}
          <SelectField label="Question Type" value={form.type} onChange={e => setForm({...form, type: e.target.value, options:["","","",""], correctOption:0})}>
            <option value="objective">Objective (MCQ)</option>
            <option value="theory">Theory (written answer)</option>
          </SelectField>

          <Textarea
            label="Question Text"
            required
            placeholder="Type the question here…"
            value={form.text}
            onChange={e => setForm({...form, text: e.target.value})}
            rows={3}
          />

          {form.type === "objective" && (
            <div className="fc-group">
              <label className="fc-label">Answer Options <span>*</span></label>
              <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:10 }}>Click the radio button next to the correct answer.</div>
              {form.options.map((opt, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <input
                    type="radio"
                    name="correct_ans"
                    checked={form.correctOption === i}
                    onChange={() => setForm({...form, correctOption: i})}
                    style={{ flexShrink:0, accentColor:"var(--green-main)", width:16, height:16 }}
                  />
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--text-muted)", minWidth:20 }}>{String.fromCharCode(65+i)}.</span>
                  <input
                    className="fc-input"
                    value={opt}
                    onChange={e => setOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65+i)}`}
                    style={{ padding:"7px 10px" }}
                  />
                </div>
              ))}
            </div>
          )}

          {form.type === "theory" && (
            <Textarea
              label="Model Answer (admin reference only — not shown to students)"
              placeholder="Expected answer for marking purposes…"
              value={form.theoryAnswer}
              onChange={e => setForm({...form, theoryAnswer: e.target.value})}
              rows={3}
            />
          )}

          <Input
            label="Marks"
            type="number" min="1" max="50"
            value={form.marks}
            onChange={e => setForm({...form, marks: +e.target.value})}
          />
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          message="Delete this question?"
          detail="This question will be permanently removed from the exam."
          onConfirm={doDelete}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}

function defaultForm() {
  return { type:"objective", text:"", options:["","","",""], correctOption:0, marks:2, theoryAnswer:"" };
}
