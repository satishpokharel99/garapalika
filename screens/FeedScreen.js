import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { supabase } from "../config/supabase";
import { useNavigation } from "@react-navigation/native";

export default function FeedScreen() {
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setIssues(data);
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const onUpvote = async (item) => {
    await supabase
      .from("issues")
      .update({ upvotes: (item.upvotes || 0) + 1 })
      .eq("id", item.id);
    fetchIssues();
  };

  return (
    <FlatList
      data={issues}
      keyExtractor={(i) => i.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchIssues} />
      }
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate("IssueDetail", { issueId: item.id })
          }
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : null}
          <View style={{ padding: 8 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.desc}
            </Text>
            <Text style={{ marginTop: 6, color: "#666" }}>
              Category: {item.category} • Status: {item.status}
            </Text>
            <View
              style={{
                flexDirection: "row",
                marginTop: 8,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                style={styles.upvoteBtn}
                onPress={() => onUpvote(item)}
              >
                <Text style={{ color: "#fff" }}>👍 {item.upvotes || 0}</Text>
              </TouchableOpacity>
              <Text style={{ color: "#999", fontSize: 12 }}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: 180 },
  title: { fontSize: 16, fontWeight: "700" },
  desc: { marginTop: 6, color: "#555" },
  upvoteBtn: {
    backgroundColor: "#27ae60",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
});
