import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerArea} edges={['top', 'left', 'right']}>
        <Text style={styles.logoText}>Artos</Text>
      </SafeAreaView>
      
      <View style={styles.content}>
        <Text style={styles.mainText}>
          Teu gaduh <Text style={styles.logoTextInline}>Artos</Text> ?
        </Text>
        <Text style={styles.mainText}>
          Matak nabung <Text style={styles.setanText}>setan</Text>
        </Text>
      </View>
      
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push('/(auth)/sign-in')}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 28, color: '#ffffff', fontWeight: '500' }}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerArea: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
  },
  logoText: {
    fontFamily: 'Georgia',
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2a6496', // Same blue as login logo
    letterSpacing: -1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  mainText: {
    fontSize: 26,
    fontWeight: '400',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  logoTextInline: {
    fontFamily: 'Georgia',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2a6496',
  },
  setanText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff4b4b', // Coral/red color
    fontFamily: 'System', // Will fallback to system rounded if not available
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3b82f6', // Main blue color from login card
    borderRadius: 9999,
    width: '100%', // Looks like it spans the width with padding in the image
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
