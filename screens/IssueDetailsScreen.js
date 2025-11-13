// screens/IssueDetailsScreen.js
import React, { useEffect, useState, useContext } from "react";
import { View, ScrollView, Image, StyleSheet, Alert } from "react-native";
import {
  Title,
  Paragraph,
  Button,
  Card,
  Text,
  Chip,
  Divider,
  Avatar,
} from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../supabaseClient";
import { AuthContext } from "../contexts/AuthContext";

export default function IssueDetailsScreen({ route, navigation }) {
  const { issueId } = route.params;
  const [issue, setIssue] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { session } = useContext(AuthContext);

  useEffect(() => {
    fetchIssue();
    fetchProfile();
  }, []);

  const fetchIssue = async () => {
    try {
      const { data, error } = await supabase
        .from("issues")
        .select("*, profiles!user_id(username, avatar_url)")
        .eq("id", issueId)
        .single();

      if (error) throw error;
      setIssue(data);
    } catch (error) {
      console.error("Error fetching issue:", error);
      Alert.alert("Error", "Failed to load issue details");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    setProfile(data);
  };

  const updateStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from("issues")
        .update({ status: newStatus })
        .eq("id", issueId);

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: session.user.id,
        action_type: "status_change",
        target_type: "issue",
        target_id: issueId,
        details: { old_status: issue.status, new_status: newStatus },
      });

      Alert.alert("Success", `Status changed to ${newStatus}`);
      fetchIssue();
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update status");
    }
  };

  const deleteIssue = async () => {
    Alert.alert(
      "Delete Issue",
      "Are you sure you want to delete this issue? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Log admin action before deleting
              await supabase.from("admin_actions").insert({
                admin_id: session.user.id,
                action_type: "delete_issue",
                target_type: "issue",
                target_id: issueId,
                details: { title: issue.title },
              });

              const { error } = await supabase
                .from("issues")
                .delete()
                .eq("id", issueId);

              if (error) throw error;

              Alert.alert("Success", "Issue deleted successfully", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Error deleting issue:", error);
              Alert.alert("Error", "Failed to delete issue");
            }
          },
        },
      ]
    );
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return { color: "#2196F3", bg: "#E3F2FD", label: "OPEN" };
      case "in_progress":
        return { color: "#FF9800", bg: "#FFF3E0", label: "IN PROGRESS" };
      case "resolved":
        return { color: "#4CAF50", bg: "#E8F5E9", label: "RESOLVED" };
      case "closed":
        return { color: "#9E9E9E", bg: "#F5F5F5", label: "CLOSED" };
      default:
        return { color: "#2196F3", bg: "#E3F2FD", label: "OPEN" };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!issue) {
    return (
      <View style={styles.centerContainer}>
        <Text>Issue not found</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo(issue.status);

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.card}>
        <Card.Content>
          {/* Author Info */}
          <View style={styles.authorRow}>
            {issue.profiles?.avatar_url ? (
              <Avatar.Image
                size={40}
                source={{ uri: issue.profiles.avatar_url }}
              />
            ) : (
              <Avatar.Icon size={40} icon="account" />
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>
                {issue.profiles?.username || "Anonymous"}
              </Text>
              <Text style={styles.dateText}>
                {new Date(issue.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Status and Category */}
          <View style={styles.metaRow}>
            <Chip
              style={[styles.statusChip, { backgroundColor: statusInfo.bg }]}
              textStyle={{ color: statusInfo.color, fontWeight: "600" }}
            >
              {statusInfo.label}
            </Chip>
            {issue.category && (
              <Chip icon="tag" mode="outlined">
                {issue.category.toUpperCase()}
              </Chip>
            )}
          </View>

          {/* Title and Description */}
          <Title style={styles.title}>{issue.title}</Title>
          <Paragraph style={styles.description}>{issue.description}</Paragraph>

          {/* Upvotes */}
          <View style={styles.votesRow}>
            <Chip icon="thumb-up">{issue.upvotes || 0} upvotes</Chip>
          </View>
        </Card.Content>

        {/* Issue Image */}
        {issue.image_url && (
          <Card.Cover source={{ uri: issue.image_url }} style={styles.image} />
        )}
      </Card>

      {/* Location Map */}
      {issue.latitude && issue.longitude && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Location</Title>
          </Card.Content>
          <MapView
            style={styles.map}
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
              title={issue.title}
            />
          </MapView>
        </Card>
      )}

      {/* Admin Controls */}
      {profile?.is_admin && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Admin Controls</Title>
            <Paragraph style={styles.adminHint}>
              Change status or delete this issue
            </Paragraph>

            {/* Status Change Buttons */}
            <View style={styles.statusButtons}>
              <Button
                mode="contained"
                onPress={() => updateStatus("open")}
                style={[styles.statusButton, { backgroundColor: "#2196F3" }]}
                disabled={issue.status === "open"}
              >
                Open
              </Button>
              <Button
                mode="contained"
                onPress={() => updateStatus("in_progress")}
                style={[styles.statusButton, { backgroundColor: "#FF9800" }]}
                disabled={issue.status === "in_progress"}
              >
                In Progress
              </Button>
            </View>

            <View style={styles.statusButtons}>
              <Button
                mode="contained"
                onPress={() => updateStatus("resolved")}
                style={[styles.statusButton, { backgroundColor: "#4CAF50" }]}
                disabled={issue.status === "resolved"}
              >
                Resolved
              </Button>
              <Button
                mode="contained"
                onPress={() => updateStatus("closed")}
                style={[styles.statusButton, { backgroundColor: "#9E9E9E" }]}
                disabled={issue.status === "closed"}
              >
                Closed
              </Button>
            </View>

            <Divider style={styles.divider} />

            {/* Delete Button */}
            <Button
              mode="outlined"
              icon="delete"
              onPress={deleteIssue}
              textColor="#F44336"
              style={styles.deleteButton}
            >
              Delete Issue
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    margin: 12,
    borderRadius: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#757575",
  },
  divider: {
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    height: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#424242",
    marginBottom: 16,
  },
  votesRow: {
    marginTop: 8,
  },
  image: {
    height: 250,
  },
  map: {
    height: 250,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  adminHint: {
    color: "#757575",
    marginBottom: 16,
  },
  statusButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statusButton: {
    flex: 1,
  },
  deleteButton: {
    marginTop: 8,
    borderColor: "#F44336",
  },
});
