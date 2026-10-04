import { CashMode, CashSheet } from '@/components/CashSheet';
import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Transaction = {
  id: string;
  name: string;
  category: string;
  amount: number;
  type: 'EXPENSE' | 'INCOME';
  created_at: string;
};

const SWIPE_WIDTH = 74;

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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      setTransactions(data as Transaction[]);
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
    Animated.timing(sheetY, {
      toValue: 800,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setCashMode(null);
      fetchTransactions();
    });
  };

  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      'Delete transaction?',
      `Delete "${transaction.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('transactions')
              .delete()
              .eq('id', transaction.id);

            if (error) {
              Alert.alert(
                'Delete failed',
                'Unable to delete this transaction.'
              );
              console.warn('Delete transaction error:', error);
              return;
            }

            setTransactions((current) =>
              current.filter((item) => item.id !== transaction.id)
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView
        style={styles.safe}
        edges={['top', 'left', 'right']}
      >
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
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchTransactions}
            />
          }
        >
          <View style={styles.monthPill}>
            <Text style={styles.monthText}>
              September 2026
            </Text>
          </View>

          <View style={styles.listContainer}>
            {transactions.length === 0 && !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No transactions yet
                </Text>
              </View>
            ) : (
              transactions.map((transaction) => (
                <SwipeTransaction
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDelete}
                />
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <CashSheet
        mode={cashMode}
        onClose={closeCashSheet}
        sheetY={sheetY}
      />
    </View>
  );
}

function SwipeTransaction({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete: (transaction: Transaction) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;

  const [opened, setOpened] = useState(false);

  const close = () => {
    setOpened(false);

    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
      mass: 0.75,
    }).start();
  };

  const open = () => {
    setOpened(true);

    Animated.spring(
      translateX, {
        toValue: -SWIPE_WIDTH,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
        mass: 0.75,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return (
          Math.abs(gesture.dx) > 8 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy)
        );
      },

      onPanResponderMove: (_, gesture) => {
        let nextX = gesture.dx;

        if (opened) {
          nextX = -SWIPE_WIDTH + gesture.dx;
        }

        // Jangan bisa swipe ke kanan terlalu jauh.
        if (nextX > 0) {
          nextX = 0;
        }

        // Batasi swipe kiri.
        if (nextX < -SWIPE_WIDTH) {
          nextX = -SWIPE_WIDTH;
        }

        translateX.setValue(nextX);
      },

      onPanResponderRelease: (_, gesture) => {
        const currentX = opened
          ? -SWIPE_WIDTH + gesture.dx
          : gesture.dx;

        if (currentX < -SWIPE_WIDTH / 2) {
          open();
        } else {
          close();
        }
      },

      onPanResponderTerminate: () => {
        close();
      },
    })
  ).current;

  return (
    <View style={styles.transactionWrapper}>
      {/* BACK ACTIONS */}
      <View style={styles.swipeActions}>

        <Pressable
          style={styles.deleteButton}
          onPress={() => {
            close();
            onDelete(transaction);
          }}
        >
          <Text style={styles.actionButtonText}>
            Delete
          </Text>
        </Pressable>
      </View>

      {/* TRANSACTION CARD */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.transactionCard,
          {
            transform: [
              {
                translateX,
              },
            ],
          },
        ]}
      >
        <Text
          style={styles.transactionName}
          numberOfLines={1}
        >
          {transaction.name}
        </Text>

        <Text
          style={styles.transactionCategory}
          numberOfLines={1}
        >
          {transaction.category}
        </Text>

        <View style={styles.amounts}>
          <Text
            style={[
              styles.amountNTD,
              {
                color:
                  transaction.type === 'EXPENSE'
                    ? '#e03a3a'
                    : '#29b85c',
              },
            ]}
          >
            {transaction.type === 'EXPENSE'
              ? '-'
              : '+'}
            NT$ {transaction.amount.toLocaleString('id-ID')}
          </Text>

          <Text style={styles.amountIDR}>
            Rp.
            {(transaction.amount * 562).toLocaleString(
              'id-ID'
            )}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  safe: {
    flex: 1,
  },

  header: {
    height: 92,
    paddingHorizontal: 28,
    justifyContent: 'flex-end',
    paddingBottom: 13,
  },

  logo: {
    fontFamily: 'Georgia',
    color: '#3484c2',
    fontSize: 45,
    fontWeight: 'bold',
    letterSpacing: -2,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },

  actionButton: {
    height: 66,
    flex: 1,
    borderRadius: 33,
    backgroundColor: '#3989c4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '400',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

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

  listContainer: {
    gap: 12,
  },

  transactionWrapper: {
    height: 82,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },

  swipeActions: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 30,
    overflow: 'hidden',
  },

  editButton: {
    width: 75,
    height: '100%',
    backgroundColor: '#e09b34',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButton: {
    width: 75,
    height: '100%',
    backgroundColor: '#e03a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  transactionCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#dfdfdf',
    borderRadius: 30,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  transactionName: {
    fontSize: 18,
    color: '#000',
    flex: 1,
    marginRight: 8,
  },

  transactionCategory: {
    fontSize: 16,
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },

  amounts: {
    flex: 1,
    alignItems: 'flex-end',
  },

  amountNTD: {
    fontSize: 18,
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
  },
});