// components/IssueCard.js
import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Text,
  Chip,
  Divider,
} from "react-native-paper";

export default function IssueCard({ issue, onPress, onUpvote, onDownvote }) {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Get status color and display name
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

  const statusInfo = getStatusInfo(issue.status);

  return (
    <Card style={styles.card} mode="elevated">
      {/* Header: Author Info */}
      <Card.Title
        title={issue.author_name || "Anonymous"}
        titleStyle={styles.authorName}
        subtitle={formatDate(issue.created_at)}
        subtitleStyle={styles.dateText}
        left={(props) =>
          issue.author_avatar ? (
            <Avatar.Image
              {...props}
              size={44}
              source={{ uri: issue.author_avatar }}
            />
          ) : (
            <Avatar.Icon
              {...props}
              size={44}
              icon="account"
              style={{ backgroundColor: "#6200EE" }}
            />
          )
        }
        style={styles.header}
      />

      <Card.Content style={styles.content}>
        {/* Status and Category Row */}
        <View style={styles.metaRow}>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: statusInfo.bg }]}
            textStyle={{
              color: statusInfo.color,
              fontWeight: "600",
              fontSize: 11,
            }}
            compact
          >
            {statusInfo.label}
          </Chip>

          {issue.category && (
            <Chip
              icon="tag"
              mode="outlined"
              style={styles.categoryChip}
              textStyle={{ fontSize: 11 }}
              compact
            >
              {issue.category.toUpperCase()}
            </Chip>
          )}
        </View>

        {/* Title */}
        <Title style={styles.title} numberOfLines={2}>
          {issue.title}
        </Title>

        {/* Description */}
        <Paragraph numberOfLines={3} style={styles.description}>
          {issue.description}
        </Paragraph>
      </Card.Content>

      {/* Issue Image */}
      {issue.image_url ? (
        <Card.Cover
          source={{ uri: issue.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}

      <Divider style={styles.divider} />

      {/* Actions Footer */}
      <Card.Actions style={styles.actions}>
        {/* Vote Section */}
        <View style={styles.voteSection}>
          <Button
            icon="arrow-up-bold"
            mode="contained-tonal"
            onPress={onUpvote}
            compact
            style={styles.upvoteButton}
            labelStyle={styles.voteLabel}
          >
            {issue.upvotes || 0}
          </Button>

          <Button
            icon="arrow-down-bold"
            mode="outlined"
            onPress={onDownvote}
            compact
            style={styles.downvoteButton}
            labelStyle={styles.voteLabel}
          ></Button>
        </View>

        {/* Comments */}
        <Button
          icon="comment-outline"
          mode="text"
          compact
          style={styles.commentButton}
          labelStyle={styles.actionLabel}
        >
          {issue.comment_count || 0}
        </Button>

        {/* View Details */}
        <Button
          mode="contained"
          onPress={onPress}
          compact
          style={styles.viewButton}
          labelStyle={styles.viewLabel}
          icon="arrow-right"
          contentStyle={{ flexDirection: "row-reverse" }}
        >
          View
        </Button>
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  header: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  statusChip: {
    height: 28,
    borderRadius: 14,
  },
  categoryChip: {
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 8,
    color: "#212121",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#616161",
  },
  image: {
    height: 200,
    marginTop: 12,
  },
  divider: {
    marginTop: 12,
    marginHorizontal: 16,
  },
  actions: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  voteSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  upvoteButton: {
    minWidth: 65,
    borderRadius: 20,
  },
  downvoteButton: {
    minWidth: 40,
    borderRadius: 20,
    borderColor: "#E0E0E0",
  },
  voteLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  commentButton: {
    minWidth: 50,
  },
  actionLabel: {
    fontSize: 13,
  },
  viewButton: {
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  viewLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
