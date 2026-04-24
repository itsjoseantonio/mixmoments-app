import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/shared/lib/supabase';
import { PurchaseSchema } from '../schemas';

export function usePlan() {
  const { user, isLoaded } = useUser();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!user) { setIsPro(false); setLoading(false); return; }

    async function check() {
      setLoading(true);
      const { data } = await supabase
        .from('purchases')
        .select('id')
        .eq('clerk_user_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();

      const result = PurchaseSchema.safeParse(data);
      setIsPro(result.success && result.data !== null);
      setLoading(false);
    }

    check();
  }, [user, isLoaded]);

  return { isPro, loading };
}
