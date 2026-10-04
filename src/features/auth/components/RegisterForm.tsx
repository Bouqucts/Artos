import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

interface RegisterFormProps {
  onGoToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onGoToLogin }) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (!passwordsMatch) return;

    setIsLoading(true);
    
    // 1. Buat user di Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setIsLoading(false);
      Alert.alert('Registration Failed', error.message);
      return;
    }

    const authUserId = data?.user?.id;
    if (!authUserId) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to create account. Please try again.');
      return;
    }

    // 2. Insert ke public.profiles
    await supabase.from('profiles').insert([{ id: authUserId, full_name: fullName }]);

    // 3. Buat akun default "Cash"
    const { data: accountData } = await supabase.from('accounts').insert([{
      user_id: authUserId,
      name: 'Cash',
      type: 'CASH',
      initial_balance: 0,
    }]).select('id').single();

    // 5. Buat kategori default
    const defaultCategories = [
      { user_id: authUserId, name: 'Salary', type: 'INCOME' },
      { user_id: authUserId, name: 'Other Income', type: 'INCOME' },
      { user_id: authUserId, name: 'Food', type: 'EXPENSE' },
      { user_id: authUserId, name: 'Groceries', type: 'EXPENSE' },
      { user_id: authUserId, name: 'Bill', type: 'EXPENSE' },
      { user_id: authUserId, name: 'Rent', type: 'EXPENSE' },
      { user_id: authUserId, name: 'Transport', type: 'EXPENSE' },
      { user_id: authUserId, name: 'Savings', type: 'EXPENSE' },
    ];
    await supabase.from('categories').insert(defaultCategories);

    setIsLoading(false);
    Alert.alert('Success', 'Account created successfully!');
    onGoToLogin();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Input
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightAccessory={
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          }
        />
        <View style={styles.confirmPasswordContainer}>
          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            containerStyle={!passwordsMatch ? { marginBottom: 4 } : {}}
            rightAccessory={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            }
          />
          {!passwordsMatch && (
            <Text style={styles.warningText}>Passwords do not match</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.loginLinkContainer}
          onPress={onGoToLogin}
        >
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginTextBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: Math.max(insets.bottom, 32) },
        ]}
      >
        <Button title="Register" onPress={handleRegister} loading={isLoading} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    paddingTop: 8,
  },
  confirmPasswordContainer: {
    marginBottom: 0,
  },
  warningText: {
    color: "#ffdddd",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 16,
    fontWeight: "500",
  },
  loginLinkContainer: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 8,
  },
  loginText: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.9,
  },
  loginTextBold: {
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    marginTop: "auto",
    paddingTop: 16,
  },
});
