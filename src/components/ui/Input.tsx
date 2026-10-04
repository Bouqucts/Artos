import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';

interface InputProps extends TextInputProps {
  containerStyle?: object;
  rightAccessory?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ containerStyle, style, rightAccessory, ...props }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, style, rightAccessory ? { paddingRight: 48 } : null]}
        placeholderTextColor="#9ca3af" // Light gray placeholder
        {...props}
      />
      {rightAccessory && (
        <View style={styles.rightAccessoryContainer}>
          {rightAccessory}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 9999, // fully rounded
    paddingHorizontal: 24,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  rightAccessoryContainer: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
