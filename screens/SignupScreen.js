// screens/SignupScreen.js
import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Title, Paragraph } from "react-native-paper";
import { supabase } from "../supabaseClient";

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim()) return alert("Enter your full name");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      return alert(error.message);
    }
    const userId = data.user?.id;
    if (userId) {
      // create profile row
      await supabase
        .from("profiles")
        .upsert({ id: userId, full_name: fullName });
    }
    setLoading(false);
    alert("Account created. Check email if confirmation is required.");
    navigation.navigate("Login");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
        <Title>Create an account</Title>
        <Paragraph style={{ marginBottom: 12 }}>
          Sign up to report and track civic issues
        </Paragraph>

        <TextInput
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          mode="outlined"
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={{ marginBottom: 12 }}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          style={{ marginBottom: 20 }}
        />

        <Button
          mode="contained"
          onPress={handleSignup}
          loading={loading}
          disabled={loading}
          style={{ marginBottom: 12 }}
        >
          Sign up
        </Button>
        <Button onPress={() => navigation.navigate("Login")}>
          Have an account? Login
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
