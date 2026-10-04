import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type DailySpend = { label: string; amount: number };
export type QuickAnalytics = {
  weekLabel: string;
  balance: number;
  income: number;
  spent: number;
  spentPercent: number;
  averageDaily: number;
  largestExpense: number;
  frequentCategory: string;
  savings: number;
  mostExpense: number;
  averageExpense: number;
  leastExpense: number;
  daily: DailySpend[];
};

const empty: QuickAnalytics = {
  weekLabel: '',
  balance: 0, income: 0, spent: 0, spentPercent: 0, averageDaily: 0,
  largestExpense: 0, frequentCategory: '—', savings: 0, mostExpense: 0, averageExpense: 0,
  leastExpense: 0, daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(label => ({ label, amount: 0 })),
};

const startOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatWeekLabel = (start: Date) => {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const month = (date: Date) => date.toLocaleString('en-US', { month: 'short' });
  const startMonth = month(start);
  const endMonth = month(end);
  return startMonth === endMonth
    ? `${start.getDate()} - ${end.getDate()} ${endMonth}.`
    : `${start.getDate()} ${startMonth}. - ${end.getDate()} ${endMonth}.`;
};

export function useQuickAnalytics() {
  const [analytics, setAnalytics] = useState<QuickAnalytics>(empty);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: accounts }, { data: transactions }] = await Promise.all([
      supabase.from('accounts').select('initial_balance').eq('user_id', user.id).eq('is_active', true),
      supabase.from('transactions').select('amount, type, transaction_date, category_id, categories(name)').eq('user_id', user.id).order('transaction_date', { ascending: false }),
    ]);

    const rows = (transactions ?? []) as Array<{ amount: number | string; type: 'INCOME' | 'EXPENSE'; transaction_date: string; categories?: { name?: string } | null }>;
    const initialBalance = (accounts ?? []).reduce((sum, account) => sum + Number(account.initial_balance ?? 0), 0);
    const income = rows.filter(row => row.type === 'INCOME').reduce((sum, row) => sum + Number(row.amount), 0);
    const spentAll = rows.filter(row => row.type === 'EXPENSE').reduce((sum, row) => sum + Number(row.amount), 0);
    const weekStart = startOfWeek().getTime();
    const weekStartDate = new Date(weekStart);
    const weekRows = rows.filter(row => new Date(row.transaction_date).getTime() >= weekStart);
    const weekExpenses = weekRows.filter(row => row.type === 'EXPENSE');
    const weekIncome = weekRows.filter(row => row.type === 'INCOME').reduce((sum, row) => sum + Number(row.amount), 0);
    const spent = weekExpenses.reduce((sum, row) => sum + Number(row.amount), 0);
    const basis = weekIncome || income || initialBalance + spentAll || 1;
    const categoryCounts = new Map<string, number>();
    weekExpenses.forEach(row => {
      const name = row.categories?.name ?? 'Uncategorized';
      categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
    });
    const frequentCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const savings = weekExpenses.filter(row => /saving|saved|save|nabung|simpan|tabung|menabung/i.test(row.categories?.name ?? '')).reduce((sum, row) => sum + Number(row.amount), 0);
    const daily = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => ({
      label,
      amount: weekExpenses.reduce((sum, row) => {
        const date = new Date(row.transaction_date);
        const day = date.getDay() === 0 ? 6 : date.getDay() - 1;
        return day === index ? sum + Number(row.amount) : sum;
      }, 0),
    }));
    const nonZeroDays = daily.filter(day => day.amount > 0).map(day => day.amount);
    const averageExpense = nonZeroDays.length ? nonZeroDays.reduce((sum, amount) => sum + amount, 0) / nonZeroDays.length : 0;

    setAnalytics({
      weekLabel: formatWeekLabel(weekStartDate),
      balance: initialBalance + income - spentAll,
      income: basis,
      spent,
      spentPercent: Math.min(100, Math.round((spent / basis) * 100)),
      averageDaily: spent / 7,
      largestExpense: weekExpenses.reduce((max, row) => Math.max(max, Number(row.amount)), 0),
      frequentCategory,
      savings,
      mostExpense: Math.max(...daily.map(day => day.amount), 0),
      averageExpense,
      leastExpense: nonZeroDays.length ? Math.min(...nonZeroDays) : 0,
      daily,
    });
  }, []);

  useEffect(() => { load(); }, [load]);
  return { ...analytics, refresh: load };
}
