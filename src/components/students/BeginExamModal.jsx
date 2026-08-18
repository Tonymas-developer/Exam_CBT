import React, { useState } from "react";
import { X, Eye, EyeOff, Loader } from "lucide-react";
import "../../css/students/BeginExamModal.css";
import { examApi } from "../../utils/api.js";

export default function BeginExamModal({ student, exam, onClose, onVerified }) {
  const [codeVisible, setCodeVisible] = useState(false);
  const [identifierVal, setIdentifierVal] = useState("");
  const [codeVal, setCodeVal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!identifierVal.trim() || !codeVal.trim()) {
      setError("Please fill in both fields before continuing.");
      return;
    }

    setLoading(true);
    try {
      await examApi.verifyIdentity(exam.id, {
        identifier: identifierVal.trim(),
        code: codeVal.trim(),
      });
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className='modal-overlay'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className='begin-exam-modal'>
        {/* Close button */}
        <button
          className='begin-exam-modal__close'
          onClick={onClose}
          aria-label='Close'
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className='begin-exam-modal__header'>
          <h2 className='begin-exam-modal__title'>Verify Your Identity</h2>
          <p className='begin-exam-modal__subtitle'>
            Confirm your details to begin <strong>{exam.subject}</strong>
          </p>
        </div>

        {/* Form */}
        <form
          className='begin-exam-modal__form'
          onSubmit={handleSubmit}
          noValidate
        >
          
          <div className='begin-exam-modal__field-group'>
            <label className='begin-exam-modal__label'>REGISTRATION NUMBER OR EMAIL</label>
            <input
              type='text'
              value={identifierVal}
              onChange={(e) => setIdentifierVal(e.target.value)}
              placeholder='Enter your registration number or email'
              className='begin-exam-modal__input'
              autoComplete='username'
            />
            <p className='begin-exam-modal__hint'>
              Same as what you use to sign in.
            </p>
          </div>

          {/* Unique exam code */}
          <div className='begin-exam-modal__field-group'>
            <label className='begin-exam-modal__label'>
              YOUR UNIQUE EXAM CODE
            </label>
            <div className='begin-exam-modal__password-wrap'>
              <input
                type={codeVisible ? "text" : "password"}
                value={codeVal}
                onChange={(e) => setCodeVal(e.target.value)}
                placeholder='Enter your Exam Code'
                className='begin-exam-modal__input begin-exam-modal__input--code'
                autoComplete='off'
              />
              <button
                type='button'
                className='begin-exam-modal__eye-btn'
                onClick={() => setCodeVisible((v) => !v)}
                aria-label={codeVisible ? "Hide code" : "Show code"}
              >
                {codeVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <p className='begin-exam-modal__hint'>
              This was provided to you by your teacher/principal.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className='begin-exam-modal__error'>
              <span style={{ fontWeight: 600 }}>⚠ </span>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className='begin-exam-modal__actions'>
            <button
              type='button'
              className='begin-exam-modal__cancel-btn'
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='begin-exam-modal__verify-btn'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={16} className='begin-exam-modal__spin' />{" "}
                  Verifying…
                </>
              ) : (
                "Continue →"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
