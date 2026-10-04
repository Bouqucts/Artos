import React, { useRef, useState, useMemo } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CashSheet, CashMode } from '@/components/CashSheet';
import { RecurringExpensesCard } from '@/features/quick/components/RecurringExpensesCard';
import { AnalysisCard } from '@/features/quick/components/AnalysisCard';
import { BalanceCard } from '@/features/quick/components/BalanceCard';
import { QuickActions } from '@/features/quick/components/QuickActions';
import { useExchangeRate } from '@/features/quick/hooks/useExchangeRate';
import { useQuickAnalytics } from '@/features/quick/hooks/useQuickAnalytics';
import { useRecurringExpenses } from '@/features/quick/hooks/useRecurringExpenses';
import { RecurringFormSheet } from '@/features/quick/components/RecurringFormSheet';
import { supabase } from '@/lib/supabase';

const spring = (value: Animated.Value, toValue: number) =>
  Animated.spring(value, {
    toValue,
    useNativeDriver: true,
    damping: 22,
    stiffness: 220,
    mass: 0.75,
  }).start();

export default function QuickPage() {
  const [cashMode, setCashMode] = useState<CashMode>(null);

  const exchangeRate = useExchangeRate();
  const analytics = useQuickAnalytics();
  const recurring = useRecurringExpenses();

  const recurringY = useRef(new Animated.Value(0)).current;
  const analysisY = useRef(new Animated.Value(0)).current;
  const balanceY = useRef(new Animated.Value(0)).current;
  const actionY = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(800)).current;
  const recurringSheetY = useRef(new Animated.Value(800)).current;
  const [recurringRaised, setRecurringRaised] = useState(false);
  const [analysisRaised, setAnalysisRaised] = useState(false);
  const [recurringFormOpen, setRecurringFormOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<import('@/features/quick/hooks/useRecurringExpenses').RecurringExpense | null>(null);

  const setRecurringState = (raised: boolean) => {
    setRecurringRaised(raised);
    if (!raised) setAnalysisRaised(false);
    spring(recurringY, raised ? -146 : 0);
    spring(balanceY, raised ? -122 : 0);
    spring(actionY, raised ? -140 : 0);
    if (!raised) spring(analysisY, 0);
  };

  const setAnalysisState = (raised: boolean) => {
    setAnalysisRaised(raised);
    if (raised && !recurringRaised) setRecurringState(true);
    spring(analysisY, raised ? -260 : 0);
  };

  const recurringPan = useMemo(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -25) setRecurringState(true);
        if (g.dy > 25) setRecurringState(false);
      },
    }), [recurringRaised]);

  const analysisPan = useMemo(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -25) setAnalysisState(true);
        if (g.dy > 25) setAnalysisState(false);
      },
    }), [analysisRaised, recurringRaised]);

  const openCashSheet = (mode: Exclude<CashMode, null>) => {
    setCashMode(mode);
    spring(sheetY, 0);
  };
  const closeCashSheet = () =>
    Animated.timing(sheetY, { toValue: 800, duration: 260, useNativeDriver: true }).start(() => {
      setCashMode(null);
      analytics.refresh();
    });

  const handleMenuAction = (action: 'add' | 'edit') => {
    if (action === 'add') { setEditingRecurring(null); setRecurringFormOpen(true); spring(recurringSheetY, 0); }
  };

  const closeRecurringForm = () => Animated.timing(recurringSheetY, { toValue: 800, duration: 240, useNativeDriver: true }).start(() => { setRecurringFormOpen(false); setEditingRecurring(null); });
  const openRecurringEdit = (item: import('@/features/quick/hooks/useRecurringExpenses').RecurringExpense) => { setEditingRecurring(item); setRecurringFormOpen(true); spring(recurringSheetY, 0); };
  const addRecurringTransaction = async (item: import('@/features/quick/hooks/useRecurringExpenses').RecurringExpense, accountId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !accountId) return;
    await supabase.from('transactions').insert({ user_id: user.id, account_id: accountId, category_id: item.category_id, type: item.type, name: item.name, amount: item.amount, note: 'Recurring expense' });
    analytics.refresh();
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.canvas}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>Artos</Text>
          </View>

          {/* Balance Card */}
          <Animated.View style={[styles.balanceSlot, { transform: [{ translateY: balanceY }], opacity: balanceY.interpolate({ inputRange: [-122, -60, 0], outputRange: [0, 0, 1] }) }]}><BalanceCard balance={analytics.balance} exchangeRate={exchangeRate} /></Animated.View>

          {/* In / Out Buttons */}
          <QuickActions translateY={actionY} onPress={openCashSheet} />

          <RecurringExpensesCard
            panHandlers={recurringPan.panHandlers}
            translateY={recurringY}
            onMenuAction={handleMenuAction}
            items={recurring.items}
            accounts={recurring.accounts}
            onAddTransaction={addRecurringTransaction}
            onDelete={recurring.remove}
            onEdit={openRecurringEdit}
          />
          <AnalysisCard panHandlers={analysisPan.panHandlers} translateY={analysisY} analytics={analytics} />
        </View>
      </SafeAreaView>

      {/* Cash In / Out Sheet */}
      <CashSheet mode={cashMode} onClose={closeCashSheet} sheetY={sheetY} />
      <RecurringFormSheet visible={recurringFormOpen} editItem={editingRecurring} sheetY={recurringSheetY} onClose={closeRecurringForm} onSaved={recurring.refresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f1f4f5' },
  safe: { flex: 1 },
  canvas: { flex: 1, overflow: 'hidden' },

  header: { height: 92, paddingHorizontal: 28, justifyContent: 'flex-end', paddingBottom: 13 },
  logo: { fontFamily: 'Georgia', color: '#3484c2', fontSize: 45, fontWeight: 'bold', letterSpacing: -2 },
  balanceSlot: { position: 'absolute', top: 106, left: 20, right: 20, height: 130 },

});
