import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SurveyData } from '../../types';
import styles from './SurveyModal.module.css';

interface SurveyModalProps {
  submitted: boolean;
  submitting: boolean;
  onSubmit: (data: SurveyData) => void;
  onClose: () => void;
}

export function SurveyModal({ submitted, submitting, onSubmit, onClose }: SurveyModalProps) {
  const t = useTranslations('survey');
  const useCaseOptions = t.raw('useCaseOptions') as string[];
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
            <p className={styles.thankYouText}>{t('thankYou')}</p>
          </div>
        ) : (
          <>
            <div className={styles.badge}>{t('badge')}</div>
            <h2 className={styles.title}>{t('title')}</h2>

            <div className={styles.options}>
              {useCaseOptions.map(option => (
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
              {t('feedbackLabel')}
              <span className={styles.optional}>{t('optional')}</span>
            </label>
            <textarea
              className={styles.textarea}
              placeholder={t('placeholder')}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
            />

            <div className={styles.actions}>
              <button className={styles.skipBtn} onClick={onClose}>{t('skip')}</button>
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!useCase || submitting}
              >
                {submitting ? t('sending') : t('send')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
