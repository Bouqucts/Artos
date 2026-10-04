import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

const { height } = Dimensions.get('window');

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [isRegistering, setIsRegistering] = useState(false);

  const registerSlideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(registerSlideAnim, {
      toValue: isRegistering ? 0 : height,
      useNativeDriver: true,
      damping: 24,
      stiffness: 220,
      mass: 0.8,
    }).start();
  }, [isRegistering]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Logo — always visible behind card */}
        <SafeAreaView style={styles.headerArea} edges={['top', 'left', 'right']}>
          <Text style={styles.logoText}>Artos</Text>
        </SafeAreaView>

        {/* Login card + floating button */}
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Blue card */}
          <View style={styles.card}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Sign in</Text>
              <View style={styles.underline} />
            </View>
            <LoginForm onGoToRegister={() => setIsRegistering(true)} />
          </View>
        </KeyboardAvoidingView>

        {/* Register card overlay — slides up on top of everything */}
        <Animated.View
          style={[styles.registerOverlay, { transform: [{ translateY: registerSlideAnim }] }]}
          pointerEvents={isRegistering ? 'auto' : 'none'}
        >
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <View style={styles.card}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Register</Text>
                <View style={styles.underline} />
              </View>
              <RegisterForm onGoToLogin={() => setIsRegistering(false)} />
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    zIndex: 0,
  },
  logoText: {
    fontFamily: 'Georgia',
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2a6496',
    letterSpacing: -1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 150,
  },
  card: {
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    // Stretch card to fill remaining space below
    flex: 1,
  },
  registerOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 6,
  },
  underline: {
    height: 3,
    backgroundColor: '#0ea5e9',
    width: '100%',
    borderRadius: 2,
  },
});
