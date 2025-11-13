// screens/TestSupabase.js
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { supabase } from "../config/supabase";

export default function TestSupabase() {
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .limit(1);
      console.log("Test:", data, error);
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Testing Supabase Connection...</Text>
    </View>
  );
}
