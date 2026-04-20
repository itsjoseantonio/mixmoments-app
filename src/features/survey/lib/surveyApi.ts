import { supabase } from '@/shared/lib/supabase';
import type { SurveyData } from '../types';

export async function saveSurveyResponse(data: SurveyData, userId?: string) {
  const { error } = await supabase.from('survey_responses').insert({
    use_case: data.useCase,
    feedback: data.feedback || null,
    user_id: userId ?? null,
  });

  if (error) throw new Error(error.message);
}
