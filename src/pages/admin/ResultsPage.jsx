import { useState, useEffect, useMemo } from "react";
import { PenLine, FileSpreadsheet, FileText, Calculator, TrendingUp, Award } from "lucide-react";
import { Badge, Btn, Modal, Input, Toast } from "../../components/admin/ui.jsx";
import { resultApi } from "../../utils/api.js";
import { exportToCSV, exportToPDF } from "../../utils/export.js";

function ordinal(n) {
  if (n === null || n === undefined) return "—";
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export default function ResultsPage({ exams, currentAdmin, caSettings }) {
  const caItems = caSettings?.items || [];
  const CA_COUNT = caItems.length || 6;

  const classOptions = useMemo(
    () => [...new Set(exams.map(e => e.class))].sort(),
    [exams]
  );
  const [selectedClass, setSelectedClass] = useState("");
  const subjectOptions = useMemo(
    () => [...new Set(exams.filter(e => !selectedClass || e.class === selectedClass).map(e => e.subject))].sort(),
    [exams, selectedClass]
  );
  const [selectedSubject, setSelectedSubject] = useState("");
  const examOptions = useMemo(
    () => exams.filter(e => (!selectedClass || e.class === selectedClass) && (!selectedSubject || e.subject === selectedSubject)),
    [exams, selectedClass, selectedSubject]
  );
  const [selectedExamId, setSelectedExamId] = useState("");

  useEffect(() => {
    if (examOptions.length === 0) { setSelectedExamId(""); return; }
    if (!examOptions.some(e => e._id === selectedExamId)) {
      setSelectedExamId(examOptions[0]._id);
    }
    
  }, [examOptions]);

  const [results, setResults]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [loadError, setLoadError]           = useState("");
  const [gradeModal, setGradeModal]         = useState(null); 
  const [gradeValues, setGradeValues]       = useState({});   
  const [toast, setToast]                   = useState(null);
  const [caEdits, setCaEdits]               = useState({});  
  const [calculating, setCalculating]       = useState(false);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  };

  const reload = async () => {
    if (!selectedExamId) { setResults([]); return; }
    setLoading(true);
    setLoadError("");
    try {
      const res = await resultApi.getAll({ examId: selectedExamId });
      const data = res.data || [];
     
      data.sort((a, b) => (a.position ?? 999999) - (b.position ?? 999999));
      setResults(data);
      
      const seeded = {};
      data.forEach(r => {
        seeded[r._id] = (r.caScores && r.caScores.length === CA_COUNT ? r.caScores : Array(CA_COUNT).fill(0))
          .map(n => String(n));
      });
      setCaEdits(seeded);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    
  }, [selectedExamId, CA_COUNT]);

  const openGrade = async (result) => {
    try {
      const res = await resultApi.get(result._id);
      setGradeModal(res.data);
      const initial = {};
      (res.data.answers || []).forEach(a => { initial[a._id] = a.marksAwarded ?? ""; });
      setGradeValues(initial);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const saveGrades = async () => {
    const grades = Object.entries(gradeValues)
      .filter(([, v]) => v !== "" && !isNaN(+v))
      .map(([answerId, v]) => ({ answerId, marksAwarded: +v }));
    try {
      await resultApi.grade(gradeModal._id, grades);
      showToast("Theory answers graded.");
      setGradeModal(null);
      await reload();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const setCaValue = (resultId, index, value) => {
    setCaEdits(prev => {
      const row = [...(prev[resultId] || Array(CA_COUNT).fill("0"))];
      row[index] = value;
      return { ...prev, [resultId]: row };
    });
  };

  const calculateCaTotals = async () => {
    setCalculating(true);
    try {
      await Promise.all(
        results.map(r => {
          const raw = caEdits[r._id] || Array(CA_COUNT).fill("0");
          const nums = raw.map(v => Number(v) || 0);
          return resultApi.updateCA(r._id, nums);
        })
      );
      showToast("CA totals calculated and saved.");
      await reload();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCalculating(false);
    }
  };

  const calculateAverages = async () => {
    setCalculating(true);
    try {
      await Promise.all(
        results.map(r => resultApi.updateCA(r._id, r.caScores && r.caScores.length === CA_COUNT ? r.caScores : Array(CA_COUNT).fill(0)))
      );
      showToast("Averages and positions recalculated.");
      await reload();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCalculating(false);
    }
  };

  const exam = exams.find(e => e._id === selectedExamId);

  const exportColumns = [
    { key: "position", label: "Position" },
    { key: "name", label: "Student" },
    { key: "class", label: "Class" },
    { key: "score", label: "Exam Score" },
    ...caItems.map((it, i) => ({ key: `ca${i}`, label: it.name })),
    { key: "caTotal", label: "CA Total" },
    { key: "average", label: "Average" },
    { key: "status", label: "Status" },
  ];

  const exportRows = () => results.map(r => {
    const ca = r.caScores && r.caScores.length === CA_COUNT ? r.caScores : Array(CA_COUNT).fill(0);
    const row = {
      position: ordinal(r.position),
      name: r.student?.fullName || "",
      class: r.student?.class || "",
      score: `${r.totalScore} / ${r.totalMarks}`,
      caTotal: r.caTotal ?? 0,
      average: r.average ?? "—",
      status: r.status === "graded" ? "Graded" : "Pending",
    };
    ca.forEach((v, i) => { row[`ca${i}`] = v; });
    return row;
  });

  const baseFilename = () => {
    const examTitle = (exam?.title || "results").replace(/[^a-z0-9]+/gi, "-");
    return `${examTitle}-results`;
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    exportToCSV(baseFilename(), exportColumns, exportRows());
  };

  const handleExportPDF = () => {
    if (results.length === 0) return;
    exportToPDF(baseFilename(), exportColumns, exportRows(), {
      title: exam ? `${exam.title} — Results` : "Exam Results",
      subtitle: exam ? `${exam.class} · ${exam.subject} · ${exam.term}` : undefined,
    });
  };

  return (
    <div>
      <div className="filter-bar" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select className="filter-select" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(""); }}>
            <option value="">All Classes</option>
            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="filter-select" style={{ minWidth:220 }} value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
            {examOptions.length === 0 && <option value="">No exams found</option>}
            {examOptions.map(ex => <option key={ex._id} value={ex._id}>{ex.title} — {ex.class}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn variant="ghost" small icon={<Calculator size={14} />} onClick={calculateCaTotals} disabled={results.length === 0 || calculating}>
            {calculating ? "Working…" : "Calculate CA Totals"}
          </Btn>
          <Btn variant="ghost" small icon={<TrendingUp size={14} />} onClick={calculateAverages} disabled={results.length === 0 || calculating}>
            Calculate Averages &amp; Positions
          </Btn>
          <Btn variant="ghost" small icon={<FileSpreadsheet size={14} />} onClick={handleExportCSV} disabled={results.length === 0}>
            Export CSV
          </Btn>
          <Btn variant="ghost" small icon={<FileText size={14} />} onClick={handleExportPDF} disabled={results.length === 0}>
            Export PDF
          </Btn>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "-10px 0 16px" }}>
        Pick a class and subject to narrow down to an exam. Enter CA scores for each student, then use
        the buttons above to save the totals and calculate the combined average and class position.
      </p>

      {loadError && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
          {loadError}
        </div>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                {["Pos","Student","Class","Exam Score", ...caItems.map(it => it.name), "CA Total","Average","Status","Actions"].map((h,i)=>(
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const row = caEdits[r._id] || Array(CA_COUNT).fill("0");
                return (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 700 }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                        {r.position === 1 && <Award size={13} color="#d4af37" />}
                        {ordinal(r.position)}
                      </span>
                    </td>
                    <td className="tbl-name">{r.student?.fullName}</td>
                    <td><Badge color="purple">{r.student?.class}</Badge></td>
                    <td>{r.totalScore} / {r.totalMarks}</td>
                    {row.map((val, i) => (
                      <td key={i}>
                        <input
                          type="number"
                          min="0"
                          max={caItems[i]?.maxScore}
                          className="ca-input"
                          value={val}
                          onChange={e => setCaValue(r._id, i, e.target.value)}
                        />
                      </td>
                    ))}
                    <td style={{ fontWeight: 700 }}>{r.caTotal ?? 0}</td>
                    <td style={{ fontWeight: 700, color: "var(--accent-dark)" }}>
                      {r.average !== null && r.average !== undefined ? r.average : "—"}
                    </td>
                    <td><Badge color={r.status === "graded" ? "green" : "amber"}>{r.status === "graded" ? "Graded" : "Pending"}</Badge></td>
                    <td>
                      {r.status === "pending" && (
                        <button className="btn btn-warning btn-sm" onClick={() => openGrade(r)}>
                          <PenLine size={12} /> Grade Theory
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && results.length === 0 && (
            <div className="empty-state">
              <p>{exam ? "No submissions yet for this exam." : "Select a class, subject, and exam to view results."}</p>
            </div>
          )}
          {loading && (
            <div className="empty-state"><p>Loading results…</p></div>
          )}
        </div>
      </div>

      {gradeModal && (
        <Modal
          title={`Grade Theory — ${gradeModal.student?.fullName}`}
          wide
          onClose={() => setGradeModal(null)}
          footer={
            <>
              <Btn variant="ghost" onClick={() => setGradeModal(null)}>Cancel</Btn>
              <Btn onClick={saveGrades}>Save Grades</Btn>
            </>
          }
        >
          {(gradeModal.answers || [])
            .filter(a => a.question?.type === "theory")
            .map((a) => (
              <div key={a._id} style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border-mid)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{a.question?.text}</div>
                <div className="theory-answer-box" style={{ marginBottom: 10 }}>
                  {a.theoryResponse || <em style={{ color: "var(--text-faint)" }}>No answer submitted.</em>}
                </div>
                <Input
                  label={`Score (out of ${a.question?.marks ?? "?"})`}
                  type="number" min="0" max={a.question?.marks}
                  value={gradeValues[a._id] ?? ""}
                  onChange={e => setGradeValues(v => ({ ...v, [a._id]: e.target.value }))}
                  placeholder="e.g. 3"
                />
              </div>
            ))}
          {(gradeModal.answers || []).filter(a => a.question?.type === "theory").length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>This result has no theory answers to grade.</p>
          )}
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}
