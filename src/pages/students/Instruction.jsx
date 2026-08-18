import React from 'react'
import {
  ArrowLeft, Clock, BookOpen, HelpCircle,
  AlertTriangle, Wifi, Shield, ChevronRight,
} from 'lucide-react'
import '../../css/students/Instruction.css'

export default function InstructionsPage({ student, exam, onStart, onBack }) {
  return (
    <div className="instructions-page">
      {/* ── Header bar ── */}
      <header className="instructions-page__header">
        <div className="instructions-page__header-left">
          <button className="instructions-page__back-btn" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="instructions-page__header-title">
              {exam.subject} — Instructions
            </div>
            <div className="instructions-page__header-sub">GFA CBT · {exam.term}</div>
          </div>
        </div>
        <div className="instructions-page__header-right">
          <span className="instructions-page__student-chip">{student.fullName}</span>
          <span className="instructions-page__student-chip instructions-page__student-chip--mono">
            {student.regNumber}
          </span>
        </div>
      </header>

      <div className="instructions-page__body">
        {/* ── Exam summary card ── */}
        <div className="instructions-page__summary">
          <div className="instructions-page__summary-col">
            <div className="instructions-page__summary-label">Subject</div>
            <div className="instructions-page__summary-value">{exam.subject}</div>
          </div>
          <div className="instructions-page__divider" />
          <div className="instructions-page__summary-col">
            <div className="instructions-page__summary-label">Class</div>
            <div className="instructions-page__summary-value">{exam.class}</div>
          </div>
          <div className="instructions-page__divider" />
          <div className="instructions-page__summary-col">
            <div className="instructions-page__summary-label">Duration</div>
            <div className="instructions-page__summary-value">{exam.durationMinutes} mins</div>
          </div>
          <div className="instructions-page__divider" />
          <div className="instructions-page__summary-col">
            <div className="instructions-page__summary-label">Questions</div>
            <div className="instructions-page__summary-value">{exam.totalQuestions}</div>
          </div>
          <div className="instructions-page__divider" />
          <div className="instructions-page__summary-col">
            <div className="instructions-page__summary-label">Term</div>
            <div className="instructions-page__summary-value">{exam.term}</div>
          </div>
        </div>

        <div className="instructions-page__columns">
          {/* ── Left: instructions list ── */}
          <div className="instructions-page__left-col">
            <h2 className="instructions-page__section-title">
              <HelpCircle size={20} color="var(--teal)" />
              Read Before You Begin
            </h2>
            <ol className="instructions-page__list">
              {exam.instructions.map((item, idx) => (
                <li key={idx} className="instructions-page__list-item">
                  <span className="instructions-page__num">{idx + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Right: quick-ref cards ── */}
          <div className="instructions-page__right-col">
            <h2 className="instructions-page__section-title">
              <Shield size={20} color="var(--teal)" />
              Quick Reference
            </h2>

            <QuickCard
              icon={<Clock size={18} color="var(--teal)" />}
              title="Countdown Timer"
              text="The timer starts the moment you click Start Exam. It counts down from the top-right corner. The timer turns amber when 30% of time remains and red at 60 seconds."
            />
            <QuickCard
              icon={<Wifi size={18} color="#10B981" />}
              title="Auto-Save"
              text="Your answers are saved automatically every 30 seconds. If your browser refreshes, you will continue from your last saved answer."
            />
            <QuickCard
              icon={<AlertTriangle size={18} color="#F59E0B" />}
              title="Tab Switching"
              text="Switching browser tabs is monitored. After 3 tab switches, your teacher is alerted. Stay on the exam page throughout."
            />
            <QuickCard
              icon={<BookOpen size={18} color="var(--teal-dark)" />}
              title="Navigation"
              text="Use the Previous / Next buttons or your ← → keyboard arrow keys to move between questions."
            />
          </div>
        </div>

        {/* ── Start button ── */}
        <div className="instructions-page__start-row">
          <p className="instructions-page__start-note">
            By clicking <strong>Start Exam</strong>, you confirm you have read and
            understood the instructions above.
          </p>
          <button className="instructions-page__start-btn" onClick={onStart}>
            Start Exam
            <ChevronRight size={20} className='chevron-right' />
          </button>
        </div>
      </div>
    </div>
  )
}

function QuickCard({ icon, title, text }) {
  return (
    <div className="quick-card">
      <div className="quick-card__icon-row">
        {icon}
        <span className="quick-card__title">{title}</span>
      </div>
      <p className="quick-card__text">{text}</p>
    </div>
  )
}