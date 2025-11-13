// screens/LoginScreen.js
import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { TextInput, Button, Title, Paragraph } from "react-native-paper";
import { supabase } from "../supabaseClient";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return alert(error.message);
    // on success, App.js listener will navigate to main
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
        <Title style={{ marginBottom: 8 }}>Welcome back</Title>
        <Paragraph style={{ marginBottom: 16 }}>
          Login to continue to Garapalika
        </Paragraph>

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
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={{ marginBottom: 12 }}
        >
          Login
        </Button>
        <Button onPress={() => navigation.navigate("Signup")}>
          Create account
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
