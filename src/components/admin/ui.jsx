import { X, AlertTriangle } from "lucide-react";

/* ── Badge ─────────────────────────────────────────────────────────────── */
export function Badge({ color = "gray", children, icon }) {
  return (
    <span className={`badge badge-${color}`}>
      {icon && icon}
      {children}
    </span>
  );
}

/* ── Modal ─────────────────────────────────────────────────────────────── */
export function Modal({ title, onClose, children, wide = false, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${wide ? "wide" : ""}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── ConfirmDialog ──────────────────────────────────────────────────────── */
export function ConfirmDialog({ message, detail, onConfirm, onCancel, danger = true }) {
  return (
    <div className="confirm-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-box">
        <div className="confirm-icon">
          <AlertTriangle size={24} />
        </div>
        <h3>{message}</h3>
        {detail && <p>{detail}</p>}
        <div className="confirm-btns">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
            {danger ? "Delete" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
export function Toast({ message, type = "success", icon }) {
  return (
    <div className={`toast ${type}`}>
      {icon}
      {message}
    </div>
  );
}

/* ── FormField (Input) ─────────────────────────────────────────────────── */
export function Field({ label, required, hint, children }) {
  return (
    <div className="fc-group">
      {label && (
        <label className="fc-label">
          {label}{required && <span>*</span>}
        </label>
      )}
      {children}
      {hint && <div className="fc-hint">{hint}</div>}
    </div>
  );
}

export function Input({ label, required, hint, ...props }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <input className="fc-input" {...props} />
    </Field>
  );
}

export function Textarea({ label, required, hint, ...props }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <textarea className="fc-textarea" {...props} />
    </Field>
  );
}

export function SelectField({ label, required, hint, children, ...props }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <select className="fc-select" {...props}>{children}</select>
    </Field>
  );
}

/* ── Btn ───────────────────────────────────────────────────────────────── */
export function Btn({ variant = "primary", small = false, icon, children, className = "", ...props }) {
  return (
    <button
      className={`btn btn-${variant} ${small ? "btn-sm" : ""} ${className}`}
      {...props}
    >
      {icon && icon}
      {children}
    </button>
  );
}

/* ── StatCard ───────────────────────────────────────────────────────────── */
export function StatCard({ label, value, icon, color = "green" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
