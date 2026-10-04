import React from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import type { CashMode } from '@/components/CashSheet';

export function QuickActions({ translateY, onPress }: { translateY: Animated.Value; onPress: (mode: Exclude<CashMode, null>) => void }) {
  return <Animated.View style={[styles.actions, { transform: [{ translateY }] }]}><Pressable style={styles.button} onPress={() => onPress('in')}><Text style={styles.text}>In</Text></Pressable><Pressable style={styles.button} onPress={() => onPress('out')}><Text style={styles.text}>Out</Text></Pressable></Animated.View>;
}

const styles = StyleSheet.create({ actions: { position: 'absolute', top: 246, left: 20, right: 20, flexDirection: 'row', gap: 12 }, button: { height: 66, flex: 1, borderRadius: 33, backgroundColor: '#3989c4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#9bd4fb' }, text: { color: '#fff', fontSize: 28, fontWeight: '400' }, });
