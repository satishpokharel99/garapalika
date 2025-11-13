// screens/IssueDetailsScreen.js
import React, { useEffect, useState, useContext } from "react";
import { View } from "react-native";
import { Title, Paragraph, Button, Card, Text } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../supabaseClient";
import { AuthContext } from "../contexts/AuthContext";

export default function IssueDetailsScreen({ route }) {
  const { issueId } = route.params;
  const [issue, setIssue] = useState(null);
  const [profile, setProfile] = useState(null);
  const { session } = useContext(AuthContext);

  const fetchIssue = async () => {
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("id", issueId)
      .single();
    if (error) return console.warn(error.message);
    setIssue(data);
  };

  useEffect(() => {
    fetchIssue();
    (async () => {
      if (!session?.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setProfile(p);
    })();
  }, []);

  const updateStatus = async (status) => {
    const { error } = await supabase
      .from("issues")
      .update({ status })
      .eq("id", issueId);
    if (error) return alert("Failed to update: " + error.message);
    fetchIssue();
  };

  if (!issue) return <Text style={{ padding: 16 }}>Loading...</Text>;

  return (
    <View style={{ flex: 1 }}>
      <Card style={{ margin: 12 }}>
        <Card.Content>
          <Title>{issue.title}</Title>
          <Paragraph>{issue.description}</Paragraph>
          <Paragraph>Status: {issue.status}</Paragraph>
          <Paragraph>Upvotes: {issue.upvotes || 0}</Paragraph>
        </Card.Content>
        {issue.image_url ? (
          <Card.Cover source={{ uri: issue.image_url }} />
        ) : null}
        {issue.latitude && issue.longitude ? (
          <MapView
            style={{ height: 200, marginTop: 8 }}
            initialRegion={{
              latitude: issue.latitude,
              longitude: issue.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: issue.latitude,
                longitude: issue.longitude,
              }}
            />
          </MapView>
        ) : null}
        {profile?.is_admin ? (
          <Card.Actions>
            <Button onPress={() => updateStatus("inprogress")}>
              Mark In Progress
            </Button>
            <Button onPress={() => updateStatus("workdone")}>
              Mark Work Done
            </Button>
          </Card.Actions>
        ) : null}
      </Card>
    </View>
  );
}
