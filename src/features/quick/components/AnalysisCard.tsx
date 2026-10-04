import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { QuickAnalytics } from '@/features/quick/hooks/useQuickAnalytics';

type Props = { panHandlers: any; translateY: Animated.Value; analytics: QuickAnalytics };

export function AnalysisCard({ panHandlers, translateY, analytics }: Props) {
  const maxDaily = Math.max(...analytics.daily.map(day => day.amount), 1);
  return <Animated.View {...panHandlers} style={[styles.card, { transform: [{ translateY }] }] }>
    <View style={styles.handle} />
    <View style={styles.heading}><Text style={styles.title}>Analysis</Text><Text style={styles.month}>{analytics.weekLabel}</Text></View>
    <View style={styles.top}>
      <View style={styles.spent}><Text style={styles.mini}>Spent</Text><SpentRing percent={analytics.spentPercent} /><Text style={styles.caption}>NT$ {Math.round(analytics.spent).toLocaleString()}</Text></View>
      <View style={styles.behavior}><Text style={styles.mini}>Savings</Text><View style={styles.savingsContent}><MaterialCommunityIcons name="piggy-bank" size={42} color="#3786c2" /><Text style={styles.savingsAmount}>NT$ {Math.round(analytics.savings).toLocaleString()}</Text><Text style={styles.savingsCaption}>saved this week</Text></View></View>
    </View>
    <View style={styles.daily}><View style={styles.dailyContent}><View style={styles.stats}><DailyStat icon="arrow-up-bold" value={`NT$ ${Math.round(analytics.mostExpense).toLocaleString()}`} /><DailyStat icon="equal-box" value={`NT$ ${Math.round(analytics.averageExpense).toLocaleString()}`} /><DailyStat icon="arrow-down-bold" value={`NT$ ${Math.round(analytics.leastExpense).toLocaleString()}`} /></View><View style={styles.chart}>{analytics.daily.map(day => <View style={styles.chartColumn} key={day.label}><View style={styles.track}><View style={[styles.bar, { height: `${Math.max(0, (day.amount / maxDaily) * 100)}%` }]} /></View><Text style={styles.day}>{day.label}</Text></View>)}</View></View></View>
  </Animated.View>;
}

function SpentRing({ percent }: { percent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const spentLength = circumference * Math.min(percent, 100) / 100;
  return <View style={styles.ring}><Svg width={82} height={82} viewBox="0 0 82 82" style={styles.ringSvg}>
    <Circle cx="41" cy="41" r={radius} fill="none" stroke="#3d8cc8" strokeWidth="7" />
    {percent > 0 && <Circle cx="41" cy="41" r={radius} fill="none" stroke="#ff575b" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${spentLength} ${circumference}`} rotation="-90" origin="41, 41" />}
  </Svg><Text style={styles.ringText}>{percent}%</Text></View>;
}

function DailyStat({ icon, value }: { icon: 'arrow-up-bold' | 'equal-box' | 'arrow-down-bold'; value: string }) { return <View style={styles.dailyStat}><MaterialCommunityIcons name={icon} size={22} color="#2f80bd" /><Text style={styles.dailyValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  card: { position: 'absolute', top: 578, left: 20, right: 20, height: 800, zIndex: 2, borderRadius: 31, backgroundColor: '#eef2f3', paddingHorizontal: 20, paddingBottom: 48, shadowColor: '#26333d', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: -5 } },
  handle: { height: 3, width: 102, alignSelf: 'center', borderRadius: 3, backgroundColor: '#d9dddf', marginTop: 12, marginBottom: 10 }, heading: { minHeight: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { color: '#30383e', fontSize: 20, fontWeight: '500' }, month: { color: '#3d474f', fontSize: 18 },
  top: { flexDirection: 'row', gap: 10, alignItems: 'stretch' }, spent: { width: 142, height: 142, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#fff' }, behavior: { flex: 1, height: 142, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, borderRadius: 24, backgroundColor: '#fff' }, mini: { color: '#2e3840', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 8 }, metrics: { width: '100%', marginTop: 9 }, savingsContent: { alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: -3 }, savingsAmount: { color: '#2e3840', fontSize: 20, fontWeight: '600', marginTop: 2 }, savingsCaption: { color: '#7b858c', fontSize: 11, marginTop: 3 },
  ring: { width: 82, height: 82, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 5 }, ringSvg: { position: 'absolute', left: 0, top: 0 }, ringText: { color: '#303a40', fontSize: 16, fontWeight: '700' }, caption: { color: '#4d5961', fontSize: 12 },
  daily: { height: 158, marginTop: 10, marginBottom: 32, padding: 13, borderRadius: 24, backgroundColor: '#fff' }, dailyContent: { flex: 1, flexDirection: 'row', alignItems: 'center' }, stats: { width: 132, paddingRight: 10, justifyContent: 'space-around', height: 96 }, dailyStat: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 27 }, dailyValue: { color: '#3e484f', fontSize: 11, fontWeight: '500' }, chart: { flex: 1, height: 101, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 3 }, chartColumn: { flex: 1, height: 101, alignItems: 'center', justifyContent: 'flex-end' }, track: { width: 12, height: 72, borderRadius: 7, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#c7e0fa' }, bar: { width: '100%', borderRadius: 7, backgroundColor: '#3888c5' }, day: { marginTop: 5, color: '#8f999f', fontSize: 8, textAlign: 'center' },
});
