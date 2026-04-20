import { useState } from 'react';
import { USE_CASE_OPTIONS } from '../../constants';
import type { SurveyData } from '../../types';
import styles from './SurveyModal.module.css';

interface SurveyModalProps {
  submitted: boolean;
  submitting: boolean;
  onSubmit: (data: SurveyData) => void;
  onClose: () => void;
}

export function SurveyModal({ submitted, submitting, onSubmit, onClose }: SurveyModalProps) {
  const [useCase, setUseCase] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (!useCase) return;
    onSubmit({ useCase, feedback });
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {submitted ? (
          <div className={styles.thankYou}>
            <div className={styles.thankYouIcon}>✦</div>
            <p className={styles.thankYouText}>Thank you — your feedback shapes what we build next.</p>
          </div>
        ) : (
          <>
            <div className={styles.badge}>Quick question</div>
            <h2 className={styles.title}>What are you using<br />Mixmoments for?</h2>

            <div className={styles.options}>
              {USE_CASE_OPTIONS.map(option => (
                <button
                  key={option}
                  className={`${styles.option} ${useCase === option ? styles.optionSelected : ''}`}
                  onClick={() => setUseCase(option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <label className={styles.label}>
              Anything you wish the app could do?
              <span className={styles.optional}>optional</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Your feedback shapes what we build next..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
            />

            <div className={styles.actions}>
              <button className={styles.skipBtn} onClick={onClose}>Skip</button>
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!useCase || submitting}
              >
                {submitting ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
