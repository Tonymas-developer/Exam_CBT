import { useState } from "react";
import {
  Shield, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  ArrowLeft, ArrowRight, LogIn, Info, KeyRound
} from "lucide-react";
import "../../css/admin/global.css";
import "../../css/admin/login.css";
import { adminAuthApi } from "../../utils/api.js";
import { Logo, SchoolName } from "../../components/common/Branding.jsx";

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "#dc2626", "#d97706", "#2E8B74", "#16a34a"];

/* ─── Forgot Password Flow ─────────────────────────────────────────── */
function ForgotPasswordFlow({ onBack }) {
  const [fpStep, setFpStep]         = useState("email");
  const [fpEmail, setFpEmail]       = useState("");
  const [otp, setOtp]               = useState(["", "", "", "", "", ""]);
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showNewPw, setShowNewPw]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [countdown, setCountdown]   = useState(60);

  const strength = passwordStrength(newPw);

  const startCountdown = () => {
    let c = 60;
    setCountdown(c);
    const t = setInterval(() => { c--; setCountdown(c); if (c <= 0) clearInterval(t); }, 1000);
  };

  const handleFpEmailNext = async () => {
    setError("");
    if (!fpEmail.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      await adminAuthApi.forgotPassword(fpEmail.trim());
      setFpStep("otp");
      startCountdown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i, val) => {
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = cleaned;
    setOtp(next);
    if (cleaned && i < 5) {
      document.getElementById(`admin-otp-${i + 1}`)?.focus();
    }
  };

  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      document.getElementById(`admin-otp-${i - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    document.getElementById(`admin-otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the full 6-digit code."); return; }
    setError("");
    setLoading(true);
    try {
      await adminAuthApi.verifyResetCode(fpEmail.trim(), code);
      setFpStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (strength < 2)     { setError("Choose a stronger password (mix letters, numbers, symbols)."); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await adminAuthApi.resetPassword({
        email: fpEmail.trim(),
        code: otp.join(""),
        newPassword: newPw,
        confirmPassword: confirmPw,
      });
      setFpStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <aside className="login-left">
        <div className="login-brand">
          <div className="login-shield"><Logo size={44} rounded={14} /></div>
          <h1><SchoolName short /></h1>
          <p><SchoolName /></p>
        </div>
        <div className="login-tagline">
          <p>Secure computer-based testing<br/>for teachers and administrators.</p>
        </div>
      </aside>

      <main className="login-right">
        <div className="login-card">

          {fpStep === "email" && (
            <>
              <button className="login-back-link" onClick={onBack}>
                <ArrowLeft size={14} /> Back to Sign In
              </button>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--navy-light), var(--navy))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <KeyRound size={26} color="#fff" />
                </div>
              </div>
              <h2 className="login-card-title">Forgot Password?</h2>
              <p className="login-card-sub">Enter your registered admin email and we'll send you a 6-digit verification code.</p>
              {error && <div className="login-error-msg"><AlertCircle size={15} />{error}</div>}
              <div className="login-form-group">
                <label>Email Address</label>
                <div className="login-input-wrap">
                  <span className="fi-icon"><Mail size={16} /></span>
                  <input
                    className={`login-input ${error ? "error" : ""}`}
                    type="email" placeholder="you@school.edu"
                    value={fpEmail}
                    onChange={e => { setFpEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleFpEmailNext()}
                    autoFocus
                  />
                </div>
              </div>
              <button className="login-submit-btn" onClick={handleFpEmailNext} disabled={loading}>
                {loading ? "Sending…" : <><span>Send Verification Code</span><ArrowRight size={16} /></>}
              </button>
            </>
          )}

          {fpStep === "otp" && (
            <>
              <button className="login-back-link" onClick={() => { setFpStep("email"); setError(""); }}>
                <ArrowLeft size={14} /> Change email
              </button>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--navy-light), var(--navy))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={26} color="#fff" />
                </div>
              </div>
              <h2 className="login-card-title">Verify Your Email</h2>
              <p className="login-card-sub">
                If <strong>{fpEmail}</strong> is registered, we've sent a 6-digit code to it. Enter it below — it expires in 10 minutes.
              </p>
              {error && <div className="login-error-msg"><AlertCircle size={15} />{error}</div>}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "16px 0" }}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`admin-otp-${i}`}
                    style={{
                      width: 42, height: 48, borderRadius: 8, border: `2px solid ${d ? "var(--teal)" : "#d1d5db"}`,
                      textAlign: "center", fontSize: 20, fontWeight: 700, outline: "none",
                      background: d ? "var(--teal-pale)" : "#f9fafb", color: "var(--navy-dark)", transition: "border 0.15s"
                    }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    onPaste={handleOtpPaste}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: -8, marginBottom: 16 }}>
                Tip: you can paste the code directly
              </p>
              <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                {countdown > 0
                  ? <>Resend code in <strong style={{ color: "var(--teal)" }}>0:{String(countdown).padStart(2, "0")}</strong></>
                  : <button className="login-back-link" style={{ display: "inline", padding: 0 }} onClick={handleFpEmailNext}>Resend code</button>
                }
              </div>
              <button className="login-submit-btn" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? "Verifying…" : <><span>Verify & Continue</span><ArrowRight size={16} /></>}
              </button>
            </>
          )}

          {fpStep === "reset" && (
            <>
              <button className="login-back-link" onClick={() => { setFpStep("otp"); setError(""); }}>
                <ArrowLeft size={14} /> Back
              </button>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--navy-light), var(--navy))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lock size={26} color="#fff" />
                </div>
              </div>
              <h2 className="login-card-title">Set New Password</h2>
              <p className="login-card-sub">Choose a strong password you haven't used before.</p>
              {error && <div className="login-error-msg"><AlertCircle size={15} /> {error}</div>}
              <div className="login-form-group">
                <label>New Password</label>
                <div className="login-input-wrap">
                  <span className="fi-icon"><Lock size={16} /></span>
                  <input className="login-input" type={showNewPw ? "text" : "password"} placeholder="Min. 8 characters"
                    value={newPw} onChange={e => { setNewPw(e.target.value); setError(""); }} />
                  <button className="eye-btn" onClick={() => setShowNewPw(v => !v)} type="button">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPw && (
                  <>
                    <div className="pw-strength-bar">
                      <div className="pw-strength-fill" style={{ width: `${strength * 25}%`, background: STRENGTH_COLORS[strength] }} />
                    </div>
                    <div className="pw-strength-label" style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</div>
                  </>
                )}
              </div>
              <div className="login-form-group">
                <label>Confirm New Password</label>
                <div className="login-input-wrap">
                  <span className="fi-icon"><Lock size={16} /></span>
                  <input className="login-input" type={showConfirm ? "text" : "password"} placeholder="Re-enter password"
                    value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleResetPassword()} />
                  <button className="eye-btn" onClick={() => setShowConfirm(v => !v)} type="button">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button className="login-submit-btn" onClick={handleResetPassword} disabled={loading}>
                {loading ? "Resetting…" : <><span>Reset Password</span><ArrowRight size={16} /></>}
              </button>
            </>
          )}

          {fpStep === "done" && (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#15803d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={28} color="#fff" />
                </div>
              </div>
              <h2 className="login-card-title">Password Reset!</h2>
              <p className="login-card-sub">Your password has been reset successfully. You can now sign in with your new credentials.</p>
              <button className="login-submit-btn" onClick={onBack}>
                <LogIn size={16} /><span>Go to Sign In</span>
              </button>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

/* ─── Main Login Page ───────────────────────────────────────────── */
export default function AdminLoginPage({ onLogin }) {
  const [step, setStep]           = useState("email");
  const [email, setEmail]         = useState("");
  const [adminId, setAdminId]     = useState(null);
  const [password, setPassword]   = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const strength = passwordStrength(password);

  if (showForgot) {
    return <ForgotPasswordFlow onBack={() => setShowForgot(false)} />;
  }

  const handleEmailNext = () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setStep("password");
  };

  const handleSetPassword = async () => {
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (strength < 2)        { setError("Choose a stronger password (mix letters, numbers, symbols)."); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await adminAuthApi.setupPassword({
        adminId,
        newPassword: password,
        confirmPassword: confirmPw,
      });
      onLogin(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");
    if (!password) { setError("Please enter your password."); return; }
    setLoading(true);
    try {
      const res = await adminAuthApi.login({ email: email.trim(), password });
      if (res.requiresPasswordSetup) {
        setAdminId(res.adminId);
        setPassword("");
        setStep("new-password");
      } else {
        onLogin(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <aside className="login-left">
        <div className="login-brand">
          <div className="login-shield"><Logo size={44} rounded={14} /></div>
          <h1><SchoolName short /></h1>
          <p><SchoolName /></p>
        </div>
        <div className="login-tagline">
          <p>Our vision is to give our students the best and prepare them for the future</p>
          <br/>
          <p style={{ fontSize: 12, opacity: 0.5 }}>All exam data is encrypted and<br/>access is role-restricted.</p>
        </div>
      </aside>

      <main className="login-right">
        <div className="login-card">
          <div className="login-step-indicator">
            <div className={`login-step-dot ${step === "email" ? "active" : "done"}`} />
            <div className={`login-step-dot ${step === "email" ? "" : "active"}`} />
          </div>

          {step === "email" && (
            <>
              <h2 className="login-card-title">Admin Sign In</h2>
              <p className="login-card-sub">Enter your registered admin email to continue.</p>
              {error && <div className="login-error-msg"><AlertCircle size={15} />{error}</div>}
              <div className="login-form-group">
                <label>Email Address</label>
                <div className="login-input-wrap">
                  <span className="fi-icon"><Mail size={16} /></span>
                  <input
                    className={`login-input ${error ? "error" : ""}`}
                    type="email" placeholder="you@school.edu"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleEmailNext()}
                    autoFocus
                  />
                </div>
              </div>
              <button className="login-submit-btn" onClick={handleEmailNext} disabled={loading}>
                {loading ? "Checking…" : <><span>Log In</span><ArrowRight size={16} /></>}
              </button>
              <div className="login-divider" style={{ marginTop: 28 }}>Admin access only</div>
              <div className="login-info-msg" style={{ marginTop: 0 }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Only accounts registered by Admin can log in here.</span>
              </div>
            </>
          )}

          {step === "new-password" && (
            <>
              <button className="login-back-link" onClick={() => { setStep("email"); setError(""); setPassword(""); setConfirmPw(""); }}>
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="login-card-title">Set Your Password</h2>
              <p className="login-card-sub">Welcome! Create a permanent password to activate your account.</p>
              <div className="login-info-msg">
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                <span>Your temp password was accepted. Set a permanent password to finish activating your account.</span>
              </div>
              {error && <div className="login-error-msg"><AlertCircle size={15} /> {error}</div>}
              <div className="login-form-group">
                <label>New Password</label>
                <div className="login-input-wrap">
                  <span className="fi-icon"><Lock size={16} /></span>
                  <input className="login-input" type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                    value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && document.getElementById("admin-confirm-pw")?.focus()} />
                  <button className="eye-btn" onClick={() => setShowPw(v => !v)} type="button">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <>
                    <div className="pw-strength-bar">
                      <div className="pw-strength-fill" style={{ width: `${strength * 25}%`, background: STRENGTH_COLORS[strength] }} />
                    </div>
                    <div className="pw-strength-label" style={{ color: STRENGTH_COLORS[strength] }}>{STRENGTH_LABELS[strength]}</div>
                  </>
                )}
              </div>
              <div className="login-form-group">
                <label>Confirm Password</label>
                <div className="login-input-wrap">
                  <span className="fi-icon"><Lock size={16} /></span>
                  <input className="login-input" id="admin-confirm-pw" type={showConfirm ? "text" : "password"} placeholder="Re-enter password"
                    value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleSetPassword()} />
                  <button className="eye-btn" onClick={() => setShowConfirm(v => !v)} type="button">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button className="login-submit-btn" onClick={handleSetPassword} disabled={loading}>
                {loading ? "Activating account…" : <><LogIn size={16} /><span>Activate & Sign In</span></>}
              </button>
            </>
          )}

          {step === "password" && (
            <>
              <button className="login-back-link" onClick={() => { setStep("email"); setError(""); setPassword(""); }}>
                <ArrowLeft size={14} /> Back
              </button>
              <h2 className="login-card-title">Welcome back</h2>
              <p className="login-card-sub">Signing in as <strong>{email}</strong></p>
              {error && <div className="login-error-msg"><AlertCircle size={15} /> {error}</div>}
              <div className="login-form-group">
                <label>Password</label>
                <div className="login-input-wrap">
                  <span className="fi-icon"><Lock size={16} /></span>
                  <input className="login-input" type={showPw ? "text" : "password"} placeholder="Enter your password"
                    value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus />
                  <button className="eye-btn" onClick={() => setShowPw(v => !v)} type="button">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ textAlign: "right", marginTop: -8, marginBottom: 12 }}>
                <button
                  className="login-back-link"
                  style={{ display: "inline-flex", padding: 0, fontSize: 13, color: "var(--teal)", border: "none", background: "none", cursor: "pointer" }}
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </div>
              <button className="login-submit-btn" onClick={handleLogin} disabled={loading}>
                {loading ? "Signing in…" : <><LogIn size={16} /><span>Sign In</span></>}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
