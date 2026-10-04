import React from 'react';
import { GlassView } from 'expo-glass-effect';
import type { StyleProp, ViewStyle } from 'react-native';

export function NativeSurface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; glassEffectStyle?: string }) {
  return <GlassView glassEffectStyle="regular" style={style}>{children}</GlassView>;
}
