import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
export function NativeSurface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; glassEffectStyle?: string }) { return <View style={style}>{children}</View>; }
