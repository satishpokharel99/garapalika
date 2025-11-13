// screens/ProfileScreen.js
import React, { useEffect, useState, useContext } from "react";
import { View } from "react-native";
import { Title, Paragraph, Button, Card } from "react-native-paper";
import { supabase } from "../supabaseClient";
import { AuthContext } from "../contexts/AuthContext";

export default function ProfileScreen() {
  const { session } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      if (!session?.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
    })();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Card style={{ padding: 12 }}>
        <Title>{profile?.full_name ?? session?.user?.email}</Title>
        <Paragraph>
          {profile?.is_admin ? "Administrator" : "Resident"}
        </Paragraph>
        <Paragraph style={{ marginTop: 8 }}>{session?.user?.email}</Paragraph>
        <Button
          mode="contained"
          style={{ marginTop: 16 }}
          onPress={handleLogout}
        >
          Logout
        </Button>
      </Card>
    </View>
  );
}
