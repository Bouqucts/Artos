import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const ACCOUNT_TYPES = ['CASH', 'BANK', 'EWALLET', 'OTHER'] as const;
const CATEGORY_TYPES = ['INCOME', 'EXPENSE'] as const;

const spring = (value: Animated.Value, toValue: number) =>
  Animated.spring(value, { toValue, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.75 }).start();

export default function SettingsPage() {
  const insets = useSafeAreaInsets();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Accounts sheet
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const accountSheetY = useRef(new Animated.Value(800)).current;
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<typeof ACCOUNT_TYPES[number]>('CASH');
  const [savingAccount, setSavingAccount] = useState(false);

  // Categories sheet
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const categorySheetY = useRef(new Animated.Value(800)).current;
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<typeof CATEGORY_TYPES[number]>('EXPENSE');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    setUserEmail(user.email ?? null);
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (profile?.full_name) setUserName(profile.full_name);
  };

  // ── ACCOUNTS ──────────────────────────────────────────────
  const openAccountSheet = async () => {
    await fetchAccounts();
    setShowAccountSheet(true);
    spring(accountSheetY, 0);
  };
  const closeAccountSheet = () => {
    Animated.timing(accountSheetY, { toValue: 800, duration: 260, useNativeDriver: true }).start(() => {
      setShowAccountSheet(false);
      setNewAccountName('');
      setNewAccountType('CASH');
    });
  };

  const fetchAccounts = async () => {
    if (!userId) return;
    const { data } = await supabase.from('accounts').select('id,name,type').eq('user_id', userId).order('created_at');
    setAccounts(data ?? []);
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim() || !userId) return;
    setSavingAccount(true);
    const { error } = await supabase.from('accounts').insert([{
      user_id: userId,
      name: newAccountName.trim(),
      type: newAccountType,
      initial_balance: 0,
    }]);
    setSavingAccount(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setNewAccountName('');
    fetchAccounts();
  };

  const handleDeleteAccount = (id: string, name: string) => {
    Alert.alert('Delete Account', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('accounts').delete().eq('id', id);
        fetchAccounts();
      }},
    ]);
  };

  // ── CATEGORIES ────────────────────────────────────────────
  const openCategorySheet = async () => {
    await fetchCategories();
    setShowCategorySheet(true);
    spring(categorySheetY, 0);
  };
  const closeCategorySheet = () => {
    Animated.timing(categorySheetY, { toValue: 800, duration: 260, useNativeDriver: true }).start(() => {
      setShowCategorySheet(false);
      setNewCategoryName('');
      setNewCategoryType('EXPENSE');
    });
  };

  const fetchCategories = async () => {
    if (!userId) return;
    const { data } = await supabase.from('categories').select('id,name,type').eq('user_id', userId).order('type').order('name');
    setCategories(data ?? []);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !userId) return;
    setSavingCategory(true);
    const { error } = await supabase.from('categories').insert([{
      user_id: userId,
      name: newCategoryName.trim(),
      type: newCategoryType,
    }]);
    setSavingCategory(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setNewCategoryName('');
    fetchCategories();
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('categories').delete().eq('id', id);
        fetchCategories();
      }},
    ]);
  };

  // ── AUTH ──────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        setIsLoggingOut(false);
        router.replace('/');
      }},
    ]);
  };

  const handleDeleteAccount2 = () => {
    Alert.alert('Delete Account', 'This will permanently delete your account and ALL your data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        Alert.alert('Are you absolutely sure?', 'All transactions, accounts, and categories will be lost forever.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Delete Everything', style: 'destructive', onPress: confirmDeleteAccount },
        ]);
      }},
    ]);
  };

  const confirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uid = user.id;
      const txIds = (await supabase.from('transactions').select('id').eq('user_id', uid)).data?.map(t => t.id) ?? [];
      if (txIds.length > 0) await supabase.from('installment_payments').delete().in('transaction_id', txIds);
      await supabase.from('transactions').delete().eq('user_id', uid);
      await supabase.from('recurring_transactions').delete().eq('user_id', uid);
      await supabase.from('installments').delete().eq('user_id', uid);
      await supabase.from('reminders').delete().eq('user_id', uid);
      await supabase.from('accounts').delete().eq('user_id', uid);
      await supabase.from('categories').delete().eq('user_id', uid);
      await supabase.from('profiles').delete().eq('id', uid);
      // public.users tidak lagi dipakai (FK sudah ke auth.users)
      await supabase.auth.signOut();
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Text style={styles.logo}>Artos</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(userName ?? userEmail ?? 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName ?? 'User'}</Text>
              <Text style={styles.profileEmail}>{userEmail ?? '—'}</Text>
            </View>
            <Feather name="user" size={20} color="#9aa4ad" />
          </View>

          {/* Management */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MANAGEMENT</Text>
            <View style={styles.card}>
              <SettingRow icon="credit-card" label="Accounts" onPress={openAccountSheet} />
              <SettingRow icon="tag" label="Categories" onPress={openCategorySheet} isLast />
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.card}>
              <SettingRow icon="log-out" iconColor="#3484c2" label="Sign Out" onPress={handleLogout} loading={isLoggingOut} isLast />
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: '#e03a3a' }]}>DANGER ZONE</Text>
            <View style={styles.card}>
              <SettingRow icon="trash-2" iconColor="#e03a3a" label="Delete Account" labelColor="#e03a3a" onPress={handleDeleteAccount2} loading={isDeletingAccount} isLast />
            </View>
            <Text style={styles.dangerNote}>Deleting your account will permanently remove all your data. This cannot be undone.</Text>
          </View>

          <Text style={styles.version}>Artos v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>

      {/* ── Accounts Sheet ── */}
      {showAccountSheet && (
        <Animated.View style={[styles.sheet, { transform: [{ translateY: accountSheetY }] }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Pressable onPress={closeAccountSheet}><Text style={styles.sheetCancel}>Done</Text></Pressable>
              <Text style={styles.sheetTitle}>Accounts</Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Add new account */}
            <View style={styles.addForm}>
              <TextInput
                value={newAccountName}
                onChangeText={setNewAccountName}
                placeholder="Account name..."
                style={styles.addInput}
                placeholderTextColor="#aaa"
              />
              {/* Account type chips */}
              <View style={styles.chips}>
                {ACCOUNT_TYPES.map(t => (
                  <Pressable key={t} onPress={() => setNewAccountType(t)} style={[styles.chip, newAccountType === t && styles.chipActive]}>
                    <Text style={[styles.chipText, newAccountType === t && styles.chipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.addButton} onPress={handleAddAccount} disabled={savingAccount}>
                {savingAccount
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.addButtonText}>+ Add Account</Text>
                }
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* List */}
            <FlatList
              data={accounts}
              keyExtractor={i => i.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.listItemIcon}>
                    <Feather name="credit-card" size={16} color="#3484c2" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemName}>{item.name}</Text>
                    <Text style={styles.listItemSub}>{item.type}</Text>
                  </View>
                  <Pressable onPress={() => handleDeleteAccount(item.id, item.name)} hitSlop={12}>
                    <Feather name="trash-2" size={17} color="#e03a3a" />
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No accounts yet.</Text>}
            />
          </KeyboardAvoidingView>
        </Animated.View>
      )}

      {/* ── Categories Sheet ── */}
      {showCategorySheet && (
        <Animated.View style={[styles.sheet, { transform: [{ translateY: categorySheetY }] }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Pressable onPress={closeCategorySheet}><Text style={styles.sheetCancel}>Done</Text></Pressable>
              <Text style={styles.sheetTitle}>Categories</Text>
              <View style={{ width: 50 }} />
            </View>

            {/* Add new category */}
            <View style={styles.addForm}>
              <TextInput
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Category name..."
                style={styles.addInput}
                placeholderTextColor="#aaa"
              />
              <View style={styles.chips}>
                {CATEGORY_TYPES.map(t => (
                  <Pressable key={t} onPress={() => setNewCategoryType(t)} style={[styles.chip, newCategoryType === t && styles.chipActive]}>
                    <Text style={[styles.chipText, newCategoryType === t && styles.chipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.addButton} onPress={handleAddCategory} disabled={savingCategory}>
                {savingCategory
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.addButtonText}>+ Add Category</Text>
                }
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* List grouped by type */}
            <FlatList
              data={categories}
              keyExtractor={i => i.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={[styles.listItemIcon, { backgroundColor: item.type === 'INCOME' ? '#29b85c18' : '#e03a3a18' }]}>
                    <Feather name={item.type === 'INCOME' ? 'trending-up' : 'trending-down'} size={16} color={item.type === 'INCOME' ? '#29b85c' : '#e03a3a'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemName}>{item.name}</Text>
                    <Text style={[styles.listItemSub, { color: item.type === 'INCOME' ? '#29b85c' : '#e03a3a' }]}>{item.type}</Text>
                  </View>
                  <Pressable onPress={() => handleDeleteCategory(item.id, item.name)} hitSlop={12}>
                    <Feather name="trash-2" size={17} color="#e03a3a" />
                  </Pressable>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No categories yet.</Text>}
            />
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </View>
  );
}

function SettingRow({
  icon, iconColor = '#3484c2', label, labelColor = '#1a2530', onPress, loading, isLast,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  iconColor?: string;
  label: string;
  labelColor?: string;
  onPress: () => void;
  loading?: boolean;
  isLast?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, !isLast && styles.rowBorder, pressed && styles.rowPressed]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconColor + '18' }]}>
        <Feather name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
      {loading
        ? <ActivityIndicator size="small" color={iconColor} />
        : <Feather name="chevron-right" size={18} color="#c0c8ce" />
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f2f5f7' },
  safe: { flex: 1 },
  header: { height: 92, paddingHorizontal: 28, justifyContent: 'flex-end', paddingBottom: 13 },
  logo: { fontFamily: 'Georgia', color: '#3484c2', fontSize: 45, fontWeight: 'bold', letterSpacing: -2 },
  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  profileCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28, shadowColor: '#1b2e3e', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#3484c2', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '600', color: '#1a2530' },
  profileEmail: { fontSize: 14, color: '#7f8e99', marginTop: 2 },

  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9aa4ad', letterSpacing: 1, marginBottom: 10, marginLeft: 6 },

  card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#1b2e3e', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#e8ecee' },
  rowPressed: { backgroundColor: '#f5f8fa' },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16 },

  dangerNote: { fontSize: 13, color: '#9aa4ad', lineHeight: 19, marginTop: 10, marginHorizontal: 6 },
  version: { textAlign: 'center', color: '#bcc5cc', fontSize: 13, marginTop: 16 },

  // Sheet
  sheet: { ...StyleSheet.absoluteFill, top: 80, backgroundColor: '#f3f6f7', borderTopLeftRadius: 34, borderTopRightRadius: 34, shadowColor: '#1b2e3e', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 12, zIndex: 100 },
  sheetHandle: { alignSelf: 'center', height: 4, width: 70, borderRadius: 3, backgroundColor: '#cbd5da', marginTop: 11 },
  sheetHeader: { height: 60, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetCancel: { fontSize: 16, color: '#277cb8', fontWeight: '600' },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#25313b' },

  // Add form
  addForm: { backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 20, padding: 18, gap: 12 },
  addInput: { fontSize: 16, color: '#1a2530', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#dde2e6', paddingBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { backgroundColor: '#e8ecee', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  chipActive: { backgroundColor: '#3484c2' },
  chipText: { fontSize: 14, color: '#3f4a54' },
  chipTextActive: { color: '#fff' },
  addButton: { backgroundColor: '#3484c2', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#dde2e6', marginVertical: 16, marginHorizontal: 18 },

  // List
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10 },
  listItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#3484c218', alignItems: 'center', justifyContent: 'center' },
  listItemName: { fontSize: 16, color: '#1a2530', fontWeight: '500' },
  listItemSub: { fontSize: 12, color: '#9aa4ad', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#aaa', fontSize: 15, marginTop: 24, fontStyle: 'italic' },
});
