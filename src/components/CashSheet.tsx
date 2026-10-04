import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  PanResponder,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export type CashMode = 'in' | 'out' | null;

interface CashSheetProps {
  mode: CashMode;
  onClose: () => void;
  sheetY: Animated.Value;
}

export function CashSheet({ mode, onClose, sheetY }: CashSheetProps) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('0');
  const [txName, setTxName] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Data dari DB
  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const sheetPan = React.useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
    onPanResponderMove: (_, g) => sheetY.setValue(Math.max(-122, g.dy)),
    onPanResponderRelease: (_, g) => { if (g.dy > 110 || g.vy > 1) onClose(); else Animated.spring(sheetY, { toValue: g.dy < -35 ? -122 : 0, useNativeDriver: true, damping: 22, stiffness: 220 }).start(); },
  })).current;

  useEffect(() => {
    if (mode) {
      loadUserData();
      // Reset fields
      setAmount('0');
      setTxName('');
      setNote('');
    }
  }, [mode]);

  const loadUserData = async () => {
    // Ambil auth user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ambil user_id dari public.users (kita simpan auth id sebagai user_id saat register)
    setUserId(user.id);

    // Ambil accounts milik user
    const { data: accs } = await supabase
      .from('accounts')
      .select('id, name, type')
      .eq('user_id', user.id)
      .eq('is_active', true);
    if (accs && accs.length > 0) {
      setAccounts(accs);
      setSelectedAccount(accs[0]);
    }

    // Ambil categories sesuai mode (INCOME atau EXPENSE)
    const categoryType = mode === 'in' ? 'INCOME' : 'EXPENSE';
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', user.id)
      .eq('type', categoryType)
      .eq('is_active', true);
    if (cats && cats.length > 0) {
      setCategories(cats);
      setSelectedCategory(cats[0]);
    }
  };

  const handleAddTransaction = async () => {
    if (!mode || !userId || !selectedAccount || !selectedCategory) return;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!txName.trim()) return;

    setIsLoading(true);

    const { error } = await supabase.from('transactions').insert([{
      user_id: userId,
      account_id: selectedAccount.id,
      category_id: selectedCategory.id,
      type: mode === 'in' ? 'INCOME' : 'EXPENSE',
      name: txName.trim(),
      amount: parsedAmount,
      note: note.trim() || null,
    }]);

    setIsLoading(false);

    if (error) {
      console.warn('Error inserting transaction:', error);
    }

    onClose();
  };

  if (!mode) return null;

  const chips = categories;

  return (
    <Animated.View {...sheetPan.panHandlers} style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}> 
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetKeyboard}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.sheetTitle}>Cash {mode === 'in' ? 'In' : 'Out'}</Text>
          <Pressable onPress={handleAddTransaction} disabled={isLoading}>
            {isLoading
              ? <ActivityIndicator size="small" color="#277cb8" />
              : <Text style={styles.save}>Add</Text>
            }
          </Pressable>
        </View>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.sheetContent, { paddingBottom: insets.bottom + 24 }]}> 
          <Text style={styles.amountLabel}>Amount (NT$)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currency}>NT$</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              selectionColor="#2f84c6"
            />
          </View>
          <View style={styles.formLine} />

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={txName}
            onChangeText={setTxName}
            placeholder="Transaction name"
            style={styles.nameInput}
            placeholderTextColor="#aaa"
          />

          <Text style={styles.fieldLabel}>Category</Text>
          {chips.length === 0 ? (
            <Text style={styles.noData}>No categories. Please register a new account.</Text>
          ) : (
            <View style={styles.chips}>
              {chips.map(cat => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.chip, selectedCategory?.id === cat.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selectedCategory?.id === cat.id && styles.chipTextActive]}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.formLine} />

          <Text style={styles.fieldLabel}>Account</Text>
          <View style={styles.chips}>
            {accounts.map(acc => (
              <Pressable
                key={acc.id}
                onPress={() => setSelectedAccount(acc)}
                style={[styles.chip, selectedAccount?.id === acc.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedAccount?.id === acc.id && styles.chipTextActive]}>
                  {acc.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.formLine} />

          <Text style={styles.fieldLabel}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            style={styles.nameInput}
            placeholderTextColor="#aaa"
          />
        </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    ...StyleSheet.absoluteFill,
    top: 122,
    backgroundColor: '#f3f6f7',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 1,
    borderColor: '#fff',
    shadowColor: '#1b2e3e',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
    zIndex: 100,
  },
  sheetKeyboard: { flex: 1 },
  sheetHandle: { alignSelf: 'center', height: 4, width: 70, borderRadius: 3, backgroundColor: '#cbd5da', marginTop: 11 },
  sheetHeader: { height: 62, paddingHorizontal: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancel: { fontSize: 16, color: '#60717d' },
  sheetTitle: { fontSize: 21, fontWeight: '700', color: '#25313b' },
  save: { fontSize: 16, color: '#277cb8', fontWeight: '700' },
  sheetContent: { marginHorizontal: 18, flex: 1, backgroundColor: '#fff', borderRadius: 30, padding: 22 },
  amountLabel: { textAlign: 'center', color: '#a1abb3', fontSize: 16 },
  amountRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginTop: 5 },
  currency: { color: '#2b3740', fontSize: 17, marginRight: 8 },
  amountInput: { color: '#29353e', fontSize: 57, fontWeight: '500', minWidth: 145, textAlign: 'center' },
  formLine: { height: StyleSheet.hairlineWidth, backgroundColor: '#ccd5da', marginVertical: 13 },
  fieldLabel: { color: '#abb4bb', fontSize: 16, marginBottom: 7 },
  chips: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', marginBottom: 4 },
  chip: { backgroundColor: '#e1e4e6', borderRadius: 17, paddingHorizontal: 16, paddingVertical: 8 },
  chipActive: { backgroundColor: '#3184c3' },
  chipText: { color: '#3f4a54', fontSize: 15 },
  chipTextActive: { color: '#fff' },
  nameInput: { fontSize: 17, color: '#34414b', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ccd5da', paddingBottom: 6, marginBottom: 4 },
  noData: { color: '#e03a3a', fontSize: 14, marginBottom: 8 },
});
