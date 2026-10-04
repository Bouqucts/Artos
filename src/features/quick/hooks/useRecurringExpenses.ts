import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type RecurringExpense = { id: string; name: string; amount: number; type: 'INCOME' | 'EXPENSE'; category_id: string; categoryName: string; frequency: string; next_date: string };
export type AccountOption = { id: string; name: string; type: string };

export function useRecurringExpenses() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const [{ data }, { data: accountRows }] = await Promise.all([
      supabase.from('recurring_transactions').select('id, name, amount, type, category_id, frequency, next_date, categories(name)').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('accounts').select('id,name,type').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: true }),
    ]);
    setAccounts((accountRows ?? []) as AccountOption[]);
    setItems(((data ?? []) as any[]).map(row => ({ id: row.id, name: row.name, amount: Number(row.amount), type: row.type, category_id: row.category_id, categoryName: row.categories?.name ?? 'Uncategorized', frequency: row.frequency, next_date: row.next_date })));
  }, []);
  useEffect(() => { load(); }, [load]);
  const remove = async (id: string) => { await supabase.from('recurring_transactions').update({ is_active: false }).eq('id', id); setItems(current => current.filter(item => item.id !== id)); };
  return { items, userId, accounts, refresh: load, remove };
}
