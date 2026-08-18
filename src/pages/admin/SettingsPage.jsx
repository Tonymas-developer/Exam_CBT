import { useState, useEffect } from "react";
import { Save, CheckCircle, Plus, X, BookOpen, Info, ClipboardList, UserCog } from "lucide-react";
import { Btn, Input, SelectField } from "../../components/admin/ui.jsx";
import { TERMS } from "../../utils/data.js";
import { subjectApi, caSettingApi, adminAuthApi } from "../../utils/api.js";
import { SCHOOL_NAME } from "../../components/common/Branding.jsx";

export default function SettingsPage({ activeTerm, setActiveTerm, subjects, reloadSubjects, isSuperAdmin, caSettings, reloadCaSettings, currentAdmin }) {
  const [schoolName, setSchoolName]   = useState(SCHOOL_NAME);
  const [session, setSession]         = useState("2025/2026");
  const [saved, setSaved]             = useState(false);

  const [newSubject, setNewSubject] = useState("");
  const [subjectError, setSubjectError] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [caItems, setCaItems] = useState([]);
  const [caError, setCaError] = useState("");
  const [caSaving, setCaSaving] = useState(false);
  const [caSaved, setCaSaved] = useState(false);

  useEffect(() => {
    if (caSettings?.items) setCaItems(caSettings.items.map(it => ({ ...it })));
  }, [caSettings]);

  const updateCaItem = (i, field, value) => {
    setCaItems(items => items.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  };

  const addCaItem = () => {
    if (caItems.length >= 8) return;
    setCaItems(items => [...items, { name: `CA${items.length + 1}`, maxScore: 10 }]);
  };

  const removeCaItem = (i) => {
    if (caItems.length <= 1) return;
    setCaItems(items => items.filter((_, idx) => idx !== i));
  };

  const saveCaSettings = async () => {
    setCaError("");
    for (const it of caItems) {
      if (!it.name || !it.name.trim()) { setCaError("Every CA column needs a name."); return; }
      if (it.name.trim().length > 10) { setCaError(`"${it.name}" is too long — CA names must be 10 characters or fewer.`); return; }
      const max = Number(it.maxScore);
      if (!Number.isFinite(max) || max < 1) { setCaError(`"${it.name}" needs a max score of at least 1.`); return; }
    }
    setCaSaving(true);
    try {
      await caSettingApi.update(caItems.map(it => ({ name: it.name.trim(), maxScore: Number(it.maxScore) })));
      setCaSaved(true);
      setTimeout(() => setCaSaved(false), 2500);
    } catch (err) {
      setCaError(err.message);
      setCaSaving(false);
      return;
    }
    setCaSaving(false);
    try {
      await reloadCaSettings();
    } catch (err) {
      setCaError(`Saved, but couldn't refresh: ${err.message}`);
    }
  };

  const [profileName, setProfileName] = useState(currentAdmin?.name || "");
  const [profileEmail, setProfileEmail] = useState(currentAdmin?.email || "");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const emailChanged = profileEmail.trim().toLowerCase() !== (currentAdmin?.email || "").toLowerCase();

  const saveProfile = async () => {
    setProfileError("");
    if (!profileName.trim()) { setProfileError("Name cannot be empty."); return; }
    if (emailChanged && !profilePassword) { setProfileError("Enter your current password to confirm the email change."); return; }
    setProfileSaving(true);
    try {
      const payload = { name: profileName };
      if (emailChanged) { payload.email = profileEmail; payload.currentPassword = profilePassword; }
      await adminAuthApi.updateMe(payload);
      setProfilePassword("");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addSubject = async (e) => {
    e.preventDefault();
    const name = newSubject.trim();
    if (!name) return;
    setSubjectError("");
    setAddingSubject(true);
    try {
      await subjectApi.create(name);
      setNewSubject("");
    } catch (err) {
      setSubjectError(err.message);
      setAddingSubject(false);
      return;
    }
    setAddingSubject(false);
    try {
      await reloadSubjects();
    } catch (err) {
      setSubjectError(`Added, but couldn't refresh the list: ${err.message}`);
    }
  };

  const removeSubject = async (subject) => {
    if (!window.confirm(`Remove "${subject.name}" from the subject list?`)) return;
    setRemovingId(subject._id);
    try {
      await subjectApi.remove(subject._id);
    } catch (err) {
      alert(err.message);
      setRemovingId(null);
      return;
    }
    setRemovingId(null);
    try {
      await reloadSubjects();
    } catch (err) {
      alert(`Removed, but couldn't refresh the list: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: 'auto' }}>

      {/* School info */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:"var(--text-dark)", marginBottom:18 }}>School Settings</div>
        <Input label="School Name" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
      
        <Input label="Academic Session" value={session} onChange={e => setSession(e.target.value)} placeholder="e.g. 2025/2026" />
        <SelectField label="Active Term" value={activeTerm} onChange={e => setActiveTerm(e.target.value)}>
          {TERMS.map(t => <option key={t}>{t}</option>)}
        </SelectField>
        <div style={{ background:"var(--warning-light)", borderRadius:"var(--radius-md)", padding:"10px 14px", fontSize:13, color:"var(--warning)" }}>
          Changing the active term filters all exams, results, and reports system-wide.
        </div>
      </div>

      {/* Subjects */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:"var(--text-dark)", marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
          <BookOpen size={16} /> Subjects Offered
        </div>
        <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>
          Add a subject here whenever the school introduces a new one — it will
          immediately show up in the exam and teacher-assignment dropdowns.
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
          {(subjects || []).length === 0 && (
            <div style={{ fontSize:13, color:"var(--text-faint)" }}>No subjects yet — add the first one below.</div>
          )}
          {(subjects || []).map(s => (
            <span key={s._id} className="badge badge-purple" style={{ display:"inline-flex", alignItems:"center", gap:6, paddingRight:6 }}>
              {s.name}
              {isSuperAdmin && (
                <button
                  onClick={() => removeSubject(s)}
                  disabled={removingId === s._id}
                  title={`Remove ${s.name}`}
                  style={{ background:"none", border:"none", cursor:"pointer", display:"flex", color:"inherit", opacity:0.7, padding:0 }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>

        {isSuperAdmin && (
          <form onSubmit={addSubject} style={{ display:"flex", gap:8 }}>
            <input
              className="input"
              style={{ flex:1 }}
              placeholder="e.g. Further Mathematics"
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
            />
            <Btn type="submit" icon={<Plus size={15} />} disabled={addingSubject || !newSubject.trim()}>
              {addingSubject ? "Adding…" : "Add"}
            </Btn>
          </form>
        )}
        {subjectError && (
          <div style={{ color:"var(--danger)", fontSize:13, marginTop:8 }}>{subjectError}</div>
        )}
      </div>

      
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:"var(--text-dark)", marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
          <ClipboardList size={16} /> Continuous Assessment (CA) Columns
        </div>
        <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>
          {isSuperAdmin
            ? "Name each CA (e.g. \"Resumption\", \"Midterm\") and set its maximum score. You can have between 1 and 8 CA — names are limited to 10 characters so the results table stays readable."
            : "Only the Admin can rename CA columns or change their max scores. This is what teachers currently see when entering CA scores."}
        </div>

        {!caSettings && <div style={{ fontSize:13, color:"var(--text-faint)" }}>Loading…</div>}

        {caSettings && (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
              {caItems.map((it, i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input
                    className="input"
                    style={{ flex:2 }}
                    value={it.name}
                    maxLength={10}
                    disabled={!isSuperAdmin}
                    placeholder={`CA${i + 1}`}
                    onChange={e => updateCaItem(i, "name", e.target.value)}
                  />
                  <input
                    className="input"
                    type="number"
                    min={1}
                    style={{ flex:1 }}
                    disabled={!isSuperAdmin}
                    value={it.maxScore}
                    onChange={e => updateCaItem(i, "maxScore", e.target.value)}
                  />
                  <span style={{ fontSize:12, color:"var(--text-faint)", width:60 }}>max score</span>
                  {isSuperAdmin && caItems.length > 1 && (
                    <button
                      onClick={() => removeCaItem(i)}
                      title="Remove column"
                      style={{ background:"none", border:"none", cursor:"pointer", color:"var(--danger)", display:"flex" }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isSuperAdmin && (
              <>
                <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                  <Btn variant="ghost" icon={<Plus size={14} />} onClick={addCaItem} disabled={caItems.length >= 8}>
                    Add CA column {caItems.length >= 8 ? "(max 8)" : ""}
                  </Btn>
                </div>
                {caError && <div style={{ color:"var(--danger)", fontSize:13, marginBottom:10 }}>{caError}</div>}
                <Btn
                  icon={caSaved ? <CheckCircle size={15} /> : <Save size={15} />}
                  variant={caSaved ? "success" : "primary"}
                  onClick={saveCaSettings}
                  disabled={caSaving}
                >
                  {caSaving ? "Saving…" : caSaved ? "CA Settings Saved!" : "Save CA Settings"}
                </Btn>
              </>
            )}
          </>
        )}
      </div>

      {/* Admin profile — change your own name / email */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ fontSize:15, fontWeight:800, color:"var(--text-dark)", marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
          <UserCog size={16} /> Your Profile
        </div>
        <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>
          Update your own name or login email. Changing your email requires your current password.
        </div>
        <Input label="Name" value={profileName} onChange={e => setProfileName(e.target.value)} />
        <Input label="Email Address" type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
        {emailChanged && (
          <Input
            label="Current Password"
            type="password"
            placeholder="Confirm it's you before changing your email"
            value={profilePassword}
            onChange={e => setProfilePassword(e.target.value)}
          />
        )}
        {profileError && <div style={{ color:"var(--danger)", fontSize:13, marginBottom:10 }}>{profileError}</div>}
        <Btn
          icon={profileSaved ? <CheckCircle size={15} /> : <Save size={15} />}
          variant={profileSaved ? "success" : "primary"}
          onClick={saveProfile}
          disabled={profileSaving}
        >
          {profileSaving ? "Saving…" : profileSaved ? "Profile Saved!" : "Save Profile"}
        </Btn>
      </div>

      <Btn icon={saved ? <CheckCircle size={15} /> : <Save size={15} />} onClick={save} variant={saved ? "success" : "primary"}>
        {saved ? "Settings Saved!" : "Save Settings"}
      </Btn>
    </div>
  );
}
