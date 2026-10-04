import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ElevatedCard } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';

export function NativeSurface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; glassEffectStyle?: string }) {
  return <View style={style}><ElevatedCard modifiers={[fillMaxSize()]} colors={{ containerColor: '#e8edf2' }} elevation={2} /><View style={StyleSheet.absoluteFill}>{children}</View></View>;
}
