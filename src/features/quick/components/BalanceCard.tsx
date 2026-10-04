import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function BalanceCard({ balance, exchangeRate }: { balance: number; exchangeRate: number | null }) {
  return <View style={styles.card}><View><Text style={styles.balance}>NT$ {Math.round(balance).toLocaleString()}</Text><Text style={styles.idr}>IDR {exchangeRate ? Math.round(balance * exchangeRate).toLocaleString() : '—'}</Text></View><View style={styles.exchange}><Text style={styles.label}>TWD → IDR</Text><View style={styles.line} /><Text style={styles.value}>NT$ 1</Text><Text style={styles.value}>{exchangeRate ? `Rp ${Math.round(exchangeRate)}` : 'Loading...'}</Text></View></View>;
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: 20, borderRadius: 30, backgroundColor: '#edf1f2', flexDirection: 'row', justifyContent: 'space-between' }, balance: { color: '#2f3539', fontSize: 32, fontWeight: '500', letterSpacing: -1 }, idr: { color: '#3d4448', fontSize: 13, marginTop: 3 }, exchange: { width: 116, alignItems: 'center', paddingTop: 4, borderRadius: 24, backgroundColor: '#fff' }, label: { color: '#687077', fontSize: 11 }, line: { height: StyleSheet.hairlineWidth, width: 84, backgroundColor: '#d7dce0', marginVertical: 7 }, value: { color: '#343b40', fontSize: 17, fontWeight: '500', lineHeight: 25 },
});
