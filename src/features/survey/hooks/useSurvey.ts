import { useState, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { capture } from '@/shared/lib/analytics';
import { saveSurveyResponse } from '../lib/surveyApi';
import { SURVEY_DONE_KEY } from '../constants';
import type { SurveyData } from '../types';

export function useSurvey() {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const triggerAfterExport = useCallback(() => {
    if (localStorage.getItem(SURVEY_DONE_KEY)) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsVisible(true), 1500);
  }, []);

  const dismiss = useCallback(() => setIsVisible(false), []);

  const submit = useCallback(async (data: SurveyData) => {
    setSubmitting(true);
    try {
      await saveSurveyResponse(data, user?.id);
      capture('survey_submitted', {
        use_case: data.useCase,
        has_feedback: data.feedback.trim().length > 0,
      });
      localStorage.setItem(SURVEY_DONE_KEY, '1');
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [user?.id]);

  return { isVisible, submitted, submitting, triggerAfterExport, dismiss, submit };
}
