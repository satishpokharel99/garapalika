// screens/HomeScreen.js
import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { Appbar, Text, FAB, SegmentedButtons } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../supabaseClient";
import IssueCard from "../components/IssueCard";
import { AuthContext } from "../contexts/AuthContext";

const ITEMS_PER_PAGE = 10;

export default function HomeScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const { session } = useContext(AuthContext);
  const flatListRef = useRef();

  // Fetch issues with pagination
  const fetchIssues = async (pageNum = 0, append = false) => {
    if (loading) return;

    setLoading(true);
    if (!append) setRefreshing(true);

    const from = pageNum * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from("issues")
      .select(
        `
        *,
        profiles!user_id (username, avatar_url)
      `,
        { count: "exact" }
      )
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.warn("fetch issues error:", error.message);
      Alert.alert("Error", "Failed to load issues");
    } else {
      const processedData = (data || []).map((issue) => ({
        ...issue,
        comment_count: issue.comments?.[0]?.count || 0,
        author_name: issue.profiles?.username || "Anonymous",
        author_avatar: issue.profiles?.avatar_url || null,
      }));

      if (append) {
        setIssues((prev) => [...prev, ...processedData]);
      } else {
        setIssues(processedData);
      }

      // Check if there are more items
      const totalFetched = append
        ? issues.length + processedData.length
        : processedData.length;
      setHasMore(totalFetched < (count || 0));
    }

    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues(0);
    setupNotifications();

    // Realtime subscription for new issues and updates
    const channel = supabase
      .channel("public:issues")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            handleIssueUpdate(payload.new);
          } else {
            fetchIssues(0); // Refresh for INSERT/DELETE
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Setup notifications for status changes
  const setupNotifications = async () => {
    if (!session?.user?.id) return;

    const { data: userIssues } = await supabase
      .from("issues")
      .select("id, status")
      .eq("user_id", session.user.id);

    // Store current statuses to compare later
    if (userIssues) {
      userIssues.forEach((issue) => {
        localStorage.setItem(`issue_status_${issue.id}`, issue.status);
      });
    }
  };

  // Handle issue status updates
  const handleIssueUpdate = (updatedIssue) => {
    if (!session?.user?.id) return;

    // Check if this is user's issue and status changed
    if (updatedIssue.user_id === session.user.id) {
      const oldStatus = localStorage.getItem(`issue_status_${updatedIssue.id}`);
      if (oldStatus && oldStatus !== updatedIssue.status) {
        Alert.alert(
          "Issue Status Updated",
          `Your issue "${updatedIssue.title}" status changed from "${oldStatus}" to "${updatedIssue.status}"`
        );
        localStorage.setItem(
          `issue_status_${updatedIssue.id}`,
          updatedIssue.status
        );
      }
    }

    // Update the issue in the list
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === updatedIssue.id ? { ...issue, ...updatedIssue } : issue
      )
    );
  };

  // Load more items (infinite scroll)
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchIssues(nextPage, true);
    }
  };

  // Handle upvote
  const handleUpvote = async (issueId) => {
    if (!session?.user) {
      Alert.alert("Authentication Required", "Please log in to vote");
      return;
    }

    try {
      const userId = session.user.id;

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id, vote_type")
        .eq("user_id", userId)
        .eq("issue_id", issueId)
        .maybeSingle();

      if (existingVote?.vote_type === 1) {
        Alert.alert("Already Voted", "You've already upvoted this issue");
        return;
      }

      // If downvoted before, update to upvote
      if (existingVote?.vote_type === -1) {
        await supabase
          .from("votes")
          .update({ vote_type: 1 })
          .eq("id", existingVote.id);
      } else {
        // Insert new upvote
        await supabase
          .from("votes")
          .insert([{ user_id: userId, issue_id: issueId, vote_type: 1 }]);
      }

      updateIssueVotes(issueId);
    } catch (e) {
      console.error("Upvote error:", e);
      Alert.alert("Error", "Failed to upvote. Please try again.");
    }
  };

  // Handle downvote
  const handleDownvote = async (issueId) => {
    if (!session?.user) {
      Alert.alert("Authentication Required", "Please log in to vote");
      return;
    }

    try {
      const userId = session.user.id;

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select("id, vote_type")
        .eq("user_id", userId)
        .eq("issue_id", issueId)
        .maybeSingle();

      if (existingVote?.vote_type === -1) {
        Alert.alert("Already Voted", "You've already downvoted this issue");
        return;
      }

      // If upvoted before, update to downvote
      if (existingVote?.vote_type === 1) {
        await supabase
          .from("votes")
          .update({ vote_type: -1 })
          .eq("id", existingVote.id);
      } else {
        // Insert new downvote
        await supabase
          .from("votes")
          .insert([{ user_id: userId, issue_id: issueId, vote_type: -1 }]);
      }

      updateIssueVotes(issueId);
    } catch (e) {
      console.error("Downvote error:", e);
      Alert.alert("Error", "Failed to downvote. Please try again.");
    }
  };

  // Update issue vote count
  const updateIssueVotes = async (issueId) => {
    const { data: votes } = await supabase
      .from("votes")
      .select("vote_type")
      .eq("issue_id", issueId);

    const upvotes = votes?.filter((v) => v.vote_type === 1).length || 0;
    const downvotes = votes?.filter((v) => v.vote_type === -1).length || 0;
    const totalVotes = upvotes - downvotes;

    await supabase
      .from("issues")
      .update({ upvotes: totalVotes })
      .eq("id", issueId);

    // Update local state
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, upvotes: totalVotes } : issue
      )
    );
  };

  // Render list view
  const renderListView = () => (
    <FlatList
      ref={flatListRef}
      data={issues}
      keyExtractor={(i) => String(i.id)}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setPage(0);
            fetchIssues(0);
          }}
        />
      }
      renderItem={({ item }) => (
        <IssueCard
          issue={item}
          onPress={() =>
            navigation.navigate("IssueDetails", { issueId: item.id })
          }
          onUpvote={() => handleUpvote(item.id)}
          onDownvote={() => handleDownvote(item.id)}
        />
      )}
      ListEmptyComponent={
        <Text style={{ padding: 20, textAlign: "center" }}>
          No issues yet — create one!
        </Text>
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading && page > 0 ? (
          <Text style={{ padding: 20, textAlign: "center" }}>
            Loading more...
          </Text>
        ) : null
      }
    />
  );

  // Render map view
  const renderMapView = () => (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: 27.7,
        longitude: 85.3,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
    >
      {issues.map((issue) => (
        <Marker
          key={issue.id}
          coordinate={{
            latitude: issue.latitude,
            longitude: issue.longitude,
          }}
          title={issue.title}
          description={issue.description}
          onCalloutPress={() =>
            navigation.navigate("IssueDetails", { issueId: issue.id })
          }
        />
      ))}
    </MapView>
  );

  return (
    <View style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.Content title="Feed" />
        <Appbar.Action
          icon="refresh"
          onPress={() => {
            setPage(0);
            fetchIssues(0);
          }}
        />
      </Appbar.Header>

      <View style={{ padding: 12 }}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: "list", label: "List", icon: "format-list-bulleted" },
            { value: "map", label: "Map", icon: "map" },
          ]}
        />
      </View>

      {viewMode === "list" ? renderListView() : renderMapView()}

      <FAB
        icon="plus"
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
        }}
        onPress={() => navigation.navigate("CreateIssue")}
      />
    </View>
  );
}
