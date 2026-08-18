import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, Send, AlertTriangle } from 'lucide-react'
import '../../css/students/Exam.css'
import { questionApi, resultApi } from '../../utils/api.js'

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

function examSessionKey(studentId, examId) {
  return `gfacbt_exam_session_${studentId || 'anon'}_${examId}`
}

function loadExamSession(studentId, examId) {
  try {
    const raw = sessionStorage.getItem(examSessionKey(studentId, examId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveExamSession(studentId, examId, data) {
  try {
    sessionStorage.setItem(examSessionKey(studentId, examId), JSON.stringify(data))
  } catch {
    
  }
}

function clearExamSession(studentId, examId) {
  try {
    sessionStorage.removeItem(examSessionKey(studentId, examId))
  } catch {
    /* ignore */
  }
}

export default function ExamPage({ student, exam, onFinish }) {
  const totalSeconds = (exam.durationMinutes || 30) * 60

 
  const savedSessionRef = useRef(loadExamSession(student._id, exam.id))
  const startedAtRef = useRef(savedSessionRef.current?.startedAt || Date.now())

  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = savedSessionRef.current
    if (saved && saved.startedAt) {
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000)
      return Math.max(totalSeconds - elapsed, 0)
    }
    return totalSeconds
  })
  const [current, setCurrent]         = useState(() => savedSessionRef.current?.current || 0)
  const [answers, setAnswers]         = useState(() => savedSessionRef.current?.answers || {})
  const [submitted, setSubmitted]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [questions, setQuestions]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [scoreResult, setScoreResult] = useState(null) 

  const submittedRef = useRef(false)

  function finishAndClear() {
    clearExamSession(student._id, exam.id)
    onFinish && onFinish()
  }

 
  useEffect(() => {
    if (submitted) return
    saveExamSession(student._id, exam.id, {
      startedAt: startedAtRef.current,
      current,
      answers,
    })
  }, [current, answers, submitted])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const res = await questionApi.getByExam(exam.id)
        if (cancelled) return
        const mapped = (res.data || []).map((q) => ({
          id: q._id,
          type: q.type,
          marks: q.marks,
          text: q.text,
          options: q.options || [],
        }))
        setQuestions(mapped)
        // Guard against a restored "current" index that no longer exists
        // (e.g. a question was removed while the student was away).
        setCurrent((c) => (mapped.length ? Math.min(c, mapped.length - 1) : 0))
      } catch (err) {
        if (!cancelled) setLoadError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [exam.id])


  useEffect(() => {
    if (!loading && !submitted && timeLeft <= 0) {
      handleSubmit(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // ── Countdown ──
  useEffect(() => {
    if (submitted || loading || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer)
          handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [submitted, loading])

  // ── Keyboard navigation ──
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft')  goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, questions.length])

  function goNext() { setCurrent((c) => Math.min(c + 1, questions.length - 1)) }
  function goPrev() { setCurrent((c) => Math.max(c - 1, 0)) }

  function selectAnswer(optionIdx) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [questions[current].id]: optionIdx }))
  }

  async function handleSubmit(auto = false) {
    if (submittedRef.current) return
    submittedRef.current = true
    setShowConfirm(false)
    setSubmitting(true)
    setSubmitError('')

    const payload = {
      examId: exam.id,
      autoSubmitted: auto,
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id],
      })),
    }

    try {
      const res = await resultApi.submit(payload)
      setScoreResult(res.data)
      setSubmitted(true)
      clearExamSession(student._id, exam.id)
    } catch (err) {
      submittedRef.current = false
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const mins     = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs     = String(timeLeft % 60).padStart(2, '0')
  const timerColor =
    timeLeft > totalSeconds * 0.3 ? '#10B981'
    : timeLeft > 60 ? '#F59E0B'
    : '#EF4444'

  const answeredCount = Object.keys(answers).length
  const q = questions[current]

  if (loading) {
    return (
      <div className="exam-page__result">
        <div className="exam-page__result-card">
          <h1 className="exam-page__result-title">Loading exam…</h1>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="exam-page__result">
        <div className="exam-page__result-card">
          <h1 className="exam-page__result-title">Couldn't load this exam</h1>
          <p className="exam-page__result-sub">{loadError}</p>
          <button className="exam-page__result-home-btn" onClick={finishAndClear}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="exam-page__result">
        <div className="exam-page__result-card">
          <div className="exam-page__result-emoji">🎉</div>
          <h1 className="exam-page__result-title">Exam Submitted!</h1>
          <p className="exam-page__result-sub">
            {exam.subject} · {student.class} · {exam.term}
          </p>
          {scoreResult && scoreResult.status === 'graded' ? (
            <div className="exam-page__score-circle">
              <span className="exam-page__score-num">{scoreResult.totalScore}</span>
              <span className="exam-page__score-max">/ {scoreResult.totalMarks}</span>
            </div>
          ) : (
            <p className="exam-page__result-note">
              Your objective answers are recorded. Theory answers are awaiting manual marking.
            </p>
          )}
          <p className="exam-page__result-note">
            Your score has been recorded.
          </p>
          <button className="exam-page__result-home-btn" onClick={finishAndClear}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!q) {
    return (
      <div className="exam-page__result">
        <div className="exam-page__result-card">
          <h1 className="exam-page__result-title">No questions available</h1>
          <p className="exam-page__result-sub">This exam doesn't have any questions yet. Please check back later.</p>
          <button className="exam-page__result-home-btn" onClick={finishAndClear}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="exam-page">
      {/* ── Sticky exam header ── */}
      <header className="exam-page__header">
        <div className="exam-page__header-info">
          <div className="exam-page__header-subject">{exam.subject}</div>
          <div className="exam-page__header-meta">
            {student.fullName} · {student.class} · {exam.term}
          </div>
        </div>

        <div className="exam-page__timer" style={{ borderColor: timerColor }}>
          <Clock size={16} color={timerColor} />
          <span className="exam-page__timer-text" style={{ color: timerColor }}>
            {mins}:{secs}
          </span>
        </div>

        <button className="exam-page__submit-btn" onClick={() => setShowConfirm(true)} disabled={submitting}>
          <Send size={16} />
          {submitting ? 'Submitting…' : 'Submit Exam'}
        </button>
      </header>

      <div className="exam-page__body">
        {submitError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            Couldn't submit your exam: {submitError}. Please try again.
          </div>
        )}

        {/* ── Progress bar ── */}
        <div className="exam-page__progress-wrap">
          <div
            className="exam-page__progress-bar"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
        <div className="exam-page__progress-label">
          {answeredCount} of {questions.length} answered
        </div>

        {/* ── Question card ── */}
        <div className="exam-page__question-card">
          <div className="exam-page__question-top">
            <span className="exam-page__question-badge">Question {current + 1}</span>
            <span className="exam-page__marks-badge">
              ⭐ {q.marks} mark{q.marks !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="exam-page__question-text">{q.text}</p>

          <div className="exam-page__options">
            {q.options.map((opt, idx) => {
              const selected = answers[q.id] === idx
              return (
                <button
                  key={idx}
                  className={`exam-page__option${selected ? ' exam-page__option--selected' : ''}`}
                  onClick={() => selectAnswer(idx)}
                >
                  <span className={`exam-page__option-label${selected ? ' exam-page__option-label--selected' : ''}`}>
                    {OPTION_LABELS[idx]}
                  </span>
                  <span className="exam-page__option-text">{opt}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="exam-page__nav-row">
          <button className="exam-page__nav-btn" onClick={goPrev} disabled={current === 0}>
            <ChevronLeft size={18} /> Previous
          </button>

          {current === questions.length - 1 ? (
            <button
              className="exam-page__nav-btn exam-page__nav-btn--submit"
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
            >
              Submit <Send size={16} />
            </button>
          ) : (
            <button className="exam-page__nav-btn" onClick={goNext}>
              Next <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* ── Question palette: at a glance, which questions are answered ── */}
        {/* <div className="exam-page__palette-card">
          <div className="exam-page__palette-header">
            <span className="exam-page__palette-title">Question Overview</span>
            <div className="exam-page__palette-legend">
              <span className="exam-page__legend-item">
                <span className="exam-page__legend-dot exam-page__legend-dot--answered" /> Answered
              </span>
              <span className="exam-page__legend-item">
                <span className="exam-page__legend-dot exam-page__legend-dot--current" /> Current
              </span>
              <span className="exam-page__legend-item">
                <span className="exam-page__legend-dot exam-page__legend-dot--unanswered" /> Unanswered
              </span>
            </div>
          </div>
          <div className="exam-page__palette">
            {questions.map((qq, idx) => {
              const isAnswered = answers[qq.id] !== undefined
              const isCurrent = idx === current
              const stateClass = isCurrent
                ? 'exam-page__palette-btn--current'
                : isAnswered
                ? 'exam-page__palette-btn--answered'
                : 'exam-page__palette-btn--unanswered'
              return (
                <button
                  key={qq.id}
                  className={`exam-page__palette-btn ${stateClass}`}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Go to question ${idx + 1}${isAnswered ? ' (answered)' : ' (unanswered)'}`}
                  title={`Question ${idx + 1}${isAnswered ? ' — answered' : ' — unanswered'}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
        </div> */}
      </div>

      {/* ── Confirm submit modal ── */}
      {showConfirm && (
        <div
          className="exam-page__confirm-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false) }}
        >
          <div className="exam-page__confirm-modal">
            <AlertTriangle size={36} color="#F59E0B" />
            <h2 className="exam-page__confirm-title">Submit Exam?</h2>
            <p className="exam-page__confirm-text">
              You have answered <strong>{answeredCount}</strong> out of{' '}
              <strong>{questions.length}</strong> questions.
              {answeredCount < questions.length && ' Unanswered questions will receive 0 marks.'}
            </p>
            <div className="exam-page__confirm-actions">
              <button className="exam-page__confirm-cancel" onClick={() => setShowConfirm(false)}>
                Go Back
              </button>
              <button className="exam-page__confirm-submit" onClick={() => handleSubmit(false)}>
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
