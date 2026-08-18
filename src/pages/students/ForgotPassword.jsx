import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ShieldCheck, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import "../../css/students/ForgotPassword.css";
import { studentAuthApi } from "../../utils/api";

const variants = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
};
const tr = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };

// ─── Icons
const MailIcon = () => <Mail size={32} color="var(--gold, #F2A83B)" strokeWidth={1.8} />;
const ShieldIcon = () => <ShieldCheck size={32} color="var(--gold, #F2A83B)" strokeWidth={1.8} />;
const LockIcon = () => <Lock size={32} color="var(--gold, #F2A83B)" strokeWidth={1.8} />;
const CheckIcon = () => <CheckCircle2 size={36} color="var(--teal-light, #64eaa0)" strokeWidth={2.2} />;
const EyeOpen = () => <Eye size={18} />;
const EyeClosed = () => <EyeOff size={18} />;

// ─── Password strength helper
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const levels = [
    { label: "Weak", color: "#ff4d4d" },
    { label: "Fair", color: "#ffa64d" },
    { label: "Good", color: "#ffe04d" },
    { label: "Strong", color: "#64eaa0" },
    { label: "Strong", color: "#64eaa0" },
  ];
  return { score: s, ...levels[s] };
}

// ─── STEP 1: Enter Email
function StepEmail({ onNext, onBack }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!valid || loading) return;
    setError("");
    setLoading(true);
    try {
      await studentAuthApi.forgotPassword(email);
      onNext(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key='email'
      variants={variants}
      initial='enter'
      animate='center'
      exit='exit'
      transition={tr}
    >
      <div className='fp-icon-circle'>
        <MailIcon />
      </div>
      <h1 className='fp-heading'>Forgot Password?</h1>
      <p className='fp-subheading'>
        Enter your email address and we'll send you a 6-digit
        verification code.
      </p>

      <form onSubmit={handleSubmit}>
        <div className='fp-field'>
          <label className='fp-label'>Email Address</label>
          <input
            className='fp-input'
            type='email'
            placeholder='Enter your email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete='email'
            autoFocus
          />
        </div>

        {error && <p className='fp-msg error'>{error}</p>}

        <motion.button
          className={`fp-btn ${!valid || loading ? "muted" : ""}`}
          whileHover={{ scale: valid && !loading ? 1.015 : 1 }}
          whileTap={{ scale: valid && !loading ? 0.98 : 1 }}
          type='submit'
        >
          {loading ? "Sending…" : "Send Verification Code →"}
        </motion.button>
      </form>

      <p className='fp-switch-row'>
        Remember your password?{" "}
        <Link to='/'>
          <button className='fp-switch-btn' onClick={onBack}>
            Sign in
          </button>
        </Link>
      </p>
    </motion.div>
  );
}

// ─── STEP 2: OTP Verification
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function StepOTP({ email, onNext, onBack }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef(Array.from({ length: OTP_LENGTH }, () => null));
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [resent]);

  const handleChange = (i, val) => {
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    if (cleaned && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1)
      inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResend = async () => {
    if (resending) return;
    setError("");
    setResending(true);
    try {
      await studentAuthApi.forgotPassword(email);
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(RESEND_SECONDS);
      setResent((r) => !r);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  const code = digits.join("");
  const full = code.length === OTP_LENGTH;

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!full || verifying) return;
    setError("");
    setVerifying(true);
    try {
      await studentAuthApi.verifyResetCode(email, code);
      onNext(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Mask email: jo***@gmail.com
  const [user, domain] = email.split("@");
  const masked = user.slice(0, 2) + "***@" + domain;

  return (
    <motion.div
      key='otp'
      variants={variants}
      initial='enter'
      animate='center'
      exit='exit'
      transition={tr}
    >
      <div className='fp-icon-circle'>
        <ShieldIcon />
      </div>
      <h1 className='fp-heading'>Verify Your Email</h1>
      <p className='fp-subheading'>
        We sent a 6-digit code to{" "}
        <span style={{ color: "var(--gold, #F2A83B)", fontWeight: 600 }}>{masked}</span>.{" "}
        Enter it below — it expires in 10 minutes.
      </p>

      <form onSubmit={handleVerify}>
        <div className='fp-otp-row'>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              className={`fp-otp-box ${d ? "filled" : ""}`}
              type='text'
              inputMode='numeric'
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <p className='fp-hint'>Tip: you can paste the code directly</p>

        <div className='fp-resend-row'>
          {countdown > 0 ? (
            <span>
              Resend code in{" "}
              <span className='fp-countdown'>
                0:{String(countdown).padStart(2, "0")}
              </span>
            </span>
          ) : (
            <span>
              Didn't receive it?{" "}
              <button type='button' className='fp-switch-btn' onClick={handleResend} disabled={resending}>
                {resending ? "Resending…" : "Resend code"}
              </button>
            </span>
          )}
        </div>

        {error && <p className='fp-msg error'>{error}</p>}

        <motion.button
          className={`fp-btn ${!full || verifying ? "muted" : ""}`}
          whileHover={{ scale: full && !verifying ? 1.015 : 1 }}
          whileTap={{ scale: full && !verifying ? 0.98 : 1 }}
          type='submit'
        >
          {verifying ? "Verifying…" : "Verify & Continue →"}
        </motion.button>
      </form>

      <p className='fp-switch-row'>
        <button type='button' className='fp-switch-btn' onClick={onBack}>
          ← Change email
        </button>
      </p>
    </motion.div>
  );
}

// ─── STEP 3: Reset Password 
function StepReset({ email, code, onNext }) {
  const [pw, setPw] = useState("");
  const [cf, setCf] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getStrength(pw);
  const match = pw && cf && pw === cf;
  const canSubmit = match && strength.score >= 2;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!canSubmit || loading) return;
    setError("");
    setLoading(true);
    try {
      await studentAuthApi.resetPassword({
        email,
        code,
        newPassword: pw,
        confirmPassword: cf,
      });
      onNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key='reset'
      variants={variants}
      initial='enter'
      animate='center'
      exit='exit'
      transition={tr}
    >
      <div className='fp-icon-circle'>
        <LockIcon />
      </div>
      <h1 className='fp-heading'>Set New Password</h1>
      <p className='fp-subheading'>
        Choose a strong password you haven't used before.
      </p>

      <form onSubmit={handleSubmit}>
        {/* New password */}
        <div className='fp-field'>
          <label className='fp-label'>
            New Password <span className='fp-required'>*</span>
          </label>
          <div className='fp-input-wrap'>
            <input
              className='fp-input has-toggle'
              type={showPw ? "text" : "password"}
              placeholder='Create a strong password'
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoComplete='new-password'
              autoFocus
            />
            <button
              className='fp-eye-btn'
              type='button'
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>

          {pw.length > 0 && (
            <div>
              <div className='fp-strength-bars'>
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className='fp-strength-bar'
                    style={{
                      background:
                        n <= strength.score ? strength.color : undefined,
                    }}
                  />
                ))}
              </div>
              <div className='fp-strength-meta'>
                <span
                  className='fp-strength-label'
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
                {strength.score < 2 && (
                  <span className='fp-strength-tip'>
                    Add uppercase, numbers, or symbols
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className='fp-field'>
          <label className='fp-label'>
            Confirm Password <span className='fp-required'>*</span>
          </label>
          <div className='fp-input-wrap'>
            <input
              className={`fp-input has-toggle ${cf && !match ? "error" : ""} ${match ? "match" : ""}`}
              type={showCf ? "text" : "password"}
              placeholder='Repeat your new password'
              value={cf}
              onChange={(e) => setCf(e.target.value)}
              autoComplete='new-password'
            />
            <button
              className='fp-eye-btn'
              type='button'
              onClick={() => setShowCf((v) => !v)}
            >
              {showCf ? <EyeOpen /> : <EyeClosed />}
            </button>
          </div>
          {cf && !match && <p className='fp-msg error'>Passwords don't match</p>}
          {match && <p className='fp-msg ok'>✓ Passwords match</p>}
        </div>

        {error && <p className='fp-msg error'>{error}</p>}

        <motion.button
          className={`fp-btn ${!canSubmit || loading ? "muted" : ""}`}
          whileHover={{ scale: canSubmit && !loading ? 1.015 : 1 }}
          whileTap={{ scale: canSubmit && !loading ? 0.98 : 1 }}
          type='submit'
        >
          {loading ? "Resetting…" : "Reset Password →"}
        </motion.button>
      </form>
    </motion.div>
  );
}

// ─── STEP 4: Success
function StepSuccess({ onSignIn }) {
  return (
    <motion.div
      key='success'
      className='fp-success'
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className='fp-icon-circle success'
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.15,
          type: "spring",
          stiffness: 260,
          damping: 18,
        }}
      >
        <CheckIcon />
      </motion.div>

      <h1 className='fp-heading'>All Done!</h1>
      <p className='fp-subheading'>
        Your password has been reset successfully. You can now sign in with your
        new credentials.
      </p>

      <Link to='/'>
        <motion.button
          className='fp-btn'
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
        >
          Go to Sign In →
        </motion.button>
      </Link>
    </motion.div>
  );
}

export default function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const goLogin = onBackToLogin || (() => {});

  return (
    <div className='fp-page'>
      <div className='fp-bg-image' aria-hidden='true' />
      <div className='fp-overlay' aria-hidden='true' />
      <div className='fp-glow' aria-hidden='true' />

      <motion.div
        className='fp-card'
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className='fp-form-clip'>
          <AnimatePresence mode='wait'>
            {step === 0 && (
              <StepEmail
                key='email'
                onNext={(em) => {
                  setEmail(em);
                  setStep(1);
                }}
                onBack={goLogin}
              />
            )}
            {step === 1 && (
              <StepOTP
                key='otp'
                email={email}
                onNext={(verifiedCode) => {
                  setCode(verifiedCode);
                  setStep(2);
                }}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <StepReset key='reset' email={email} code={code} onNext={() => setStep(3)} />
            )}
            {step === 3 && <StepSuccess key='success' onSignIn={goLogin} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
