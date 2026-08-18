import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import "../../css/students/Auth.css";
// import { Link } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";
import { studentAuthApi } from "../../utils/api";
import { CLASSES } from "../../utils/data";

function Field({ label, required, children }) {
  return (
    <div className='auth-field'>
      <label className='auth-label'>
        {label}
        {required && <span className='required-star'>*</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ id, type = "text", placeholder, value, onChange }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className='auth-input'
      autoComplete='off'
    />
  );
}

function PasswordInput({ id, placeholder, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className='auth-input-wrap'>
      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className='auth-input has-toggle'
        autoComplete='new-password'
      />
      <button
        type='button'
        className='auth-eye-btn'
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  );
}

function ClassSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className='auth-input auth-select'
    >
      <option value='' disabled>
        Select your class
      </option>
      {CLASSES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

function AuthMessage({ type, children }) {
  if (!children) return null;
  return <p className={`auth-message ${type}`}>{children}</p>;
}

const slideVariants = {
  enterFromRight: { opacity: 0, x: 30 },
  enterFromLeft: { opacity: 0, x: -30 },
  center: { opacity: 1, x: 0 },
  exitToLeft: { opacity: 0, x: -30 },
  exitToRight: { opacity: 0, x: 30 },
};

const transition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] };

function LoginForm({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!email || !code) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAuthApi.login({
        identifier: email,
        password: code,
      });

      if (res.requiresPasswordSetup) {
        setError(
          "Please set your password first. Check your email or contact your admin.",
        );
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key='login'
      variants={slideVariants}
      initial='enterFromLeft'
      animate='center'
      exit='exitToRight'
      transition={transition}
    >
      <form onSubmit={handleLogin}>
        <h1 className='auth-heading'>Login</h1>
        <p className='auth-subheading'>
          Enter your email (or reg. number) and password
        </p>

        <Field label='Email or Registration Number'>
          <TextInput
            id='login-email'
            type='text'
            placeholder='Email address, or your registration number'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label='Password'>
          <PasswordInput
            id='password'
            placeholder='Enter your password'
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>

        {/* <Link to='/forgot-password' className="auth-switch-btn">
          <p>Forgot password?</p>
        </Link> */}

        <button
          type='button'
          className='auth-forgot-password'
          onClick={() => navigate("/forgot-password")}
        >
          Forgot password?
        </button>

        <AuthMessage type='error'>{error}</AuthMessage>

        <motion.button
          className='auth-btn'
          whileHover={{ scale: loading ? 1 : 1.015 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          type='submit'
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In →"}
        </motion.button>

        <p className='auth-switch'>
          Don't have account?{" "}
          <button className='auth-switch-btn' onClick={onSwitch} type='button'>
            Create an account
          </button>
        </p>
      </form>
    </motion.div>
  );
}

function RegisterForm({ onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [cls, setCls] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !cls) {
      setError("Please fill in your name, email, password, and class.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await studentAuthApi.register({
        fullName: name,
        email,
        phone,
        password,
        class: cls,
      });

      setSuccess(`Account created successfully!`);

      setTimeout(() => onSwitch(), 2200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key='register'
      variants={slideVariants}
      initial='enterFromRight'
      animate='center'
      exit='exitToLeft'
      transition={transition}
    >
      <h1 className='auth-heading'>Create Account</h1>
      <p className='auth-subheading'>Register to access your school exams</p>

      <form onSubmit={handleRegister}>
        <Field label='Full Name ' required>
          <TextInput
            id='reg-name'
            placeholder='As on school roll'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label='Email Address ' required>
          <TextInput
            id='reg-email'
            type='email'
            placeholder='Enter your email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label='Password' required>
          <PasswordInput
            id='password'
            placeholder='Enter your password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <Field label='Phone Number'>
          <TextInput
            id='reg-phone'
            type='tel'
            placeholder='E.G 08012345678'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        <Field label='Class ' required>
          <ClassSelect value={cls} onChange={(e) => setCls(e.target.value)} />
        </Field>

        <AuthMessage type='error'>{error}</AuthMessage>
        <AuthMessage type='success'>{success}</AuthMessage>

        <motion.button
          className='auth-btn'
          whileHover={{ scale: loading ? 1 : 1.015 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          type='submit'
          disabled={loading || !!success}
        >
          {loading ? "Creating account…" : "Continue →"}
        </motion.button>

        <p className='auth-switch'>
          Already registered?{" "}
          <button className='auth-switch-btn' onClick={onSwitch} type='button'>
            Sign in here
          </button>
        </p>
      </form>
    </motion.div>
  );
}

export default function Auth() {
  const [view, setView] = useState("login");

  return (
    <div className='auth-page'>
      <div className='auth-bg-image' aria-hidden='true' />
      <div className='auth-bg-overlay' aria-hidden='true' />
      <div className='auth-bg-glow' aria-hidden='true' />

      {/* Card */}
      <motion.div
        className='auth-card'
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Form area */}
        <div className='auth-form-clip'>
          <AnimatePresence mode='wait'>
            {view === "login" ? (
              <LoginForm key='login' onSwitch={() => setView("register")} />
            ) : (
              <RegisterForm key='register' onSwitch={() => setView("login")} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <Link to='/admin' className='auth-staff-link'>
        Staff / Admin Login →
      </Link>
    </div>
  );
}
