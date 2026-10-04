import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CashSheet, CashMode } from '@/components/CashSheet';
import { supabase } from '@/lib/supabase';

const spring = (value: Animated.Value, toValue: number) =>
  Animated.spring(value, {
    toValue,
    useNativeDriver: true,
    damping: 22,
    stiffness: 220,
    mass: 0.75,
  }).start();

export default function TransactionsPage() {
  const [cashMode, setCashMode] = useState<CashMode>(null);
  const sheetY = useRef(new Animated.Value(800)).current;
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching transactions:', error);
    } else if (data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const openCashSheet = (mode: Exclude<CashMode, null>) => {
    setCashMode(mode);
    spring(sheetY, 0);
  };
  const closeCashSheet = () => {
    Animated.timing(sheetY, { toValue: 800, duration: 260, useNativeDriver: true }).start(() => {
      setCashMode(null);
      // Refresh list after adding new transaction
      fetchTransactions();
    });
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.logo}>Artos</Text>
        </View>

        <View style={styles.actions}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => openCashSheet('in')}
          >
            <Text style={styles.actionText}>In</Text>
          </Pressable>
          <Pressable 
            style={styles.actionButton}
            onPress={() => openCashSheet('out')}
          >
            <Text style={styles.actionText}>Out</Text>
          </Pressable>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchTransactions} />
          }
        >
          <View style={styles.monthPill}>
            <Text style={styles.monthText}>September 2026</Text>
          </View>

          <View style={styles.listContainer}>
            {transactions.length === 0 && !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No transactions yet</Text>
              </View>
            ) : (
              transactions.map((t) => {
                const amountNTD = t.amount || 0;
                const amountIDR = amountNTD * 562; // Asumsi kurs kasar untuk tampilan
                
                return (
                  <View key={t.id} style={styles.transactionCard}>
                    <Text style={styles.transactionName}>{t.name}</Text>
                    <Text style={styles.transactionCategory}>{t.category}</Text>
                    <View style={styles.amounts}>
                      <Text style={[styles.amountNTD, { color: t.type === 'Expense' ? '#e03a3a' : '#29b85c' }]}>
                        {t.type === 'Expense' ? '-' : '+'}${amountNTD.toLocaleString('id-ID')}
                      </Text>
                      <Text style={styles.amountIDR}>Rp.{amountIDR.toLocaleString('id-ID')}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <CashSheet mode={cashMode} onClose={closeCashSheet} sheetY={sheetY} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  safe: { flex: 1 },
  header: { height: 92, paddingHorizontal: 28, justifyContent: 'flex-end', paddingBottom: 13 },
  logo: { fontFamily: 'Georgia', color: '#3484c2', fontSize: 45, fontWeight: 'bold', letterSpacing: -2 },
  
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16, marginBottom: 24 },
  actionButton: { height: 66, flex: 1, borderRadius: 33, backgroundColor: '#3989c4', alignItems: 'center', justifyContent: 'center' },
  actionButtonActive: { backgroundColor: '#2a6a9b' }, // darker state if needed
  actionText: { color: '#fff', fontSize: 28, fontWeight: '400' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  
  monthPill: {
    backgroundColor: '#d6d6d6',
    borderRadius: 30,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    color: '#000',
  },

  listContainer: { gap: 12 },
  transactionCard: {
    backgroundColor: '#dfdfdf',
    borderRadius: 30,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionName: {
    fontSize: 18,
    color: '#000',
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  amounts: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountNTD: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
  },
  amountIDR: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  }
});
