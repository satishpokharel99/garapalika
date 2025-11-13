import React, { useState, useContext, useRef } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  ActivityIndicator,
  useTheme,
  Card,
  Menu,
  IconButton,
  Chip,
  HelperText,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../supabaseClient";
import { AuthContext } from "../contexts/AuthContext";

const CATEGORIES = [
  { label: "Road Issue", value: "road" },
  { label: "Waste Management", value: "waste" },
  { label: "Water Supply", value: "water" },
  { label: "Electricity", value: "electricity" },
  { label: "Public Safety", value: "safety" },
  { label: "Infrastructure", value: "infrastructure" },
  { label: "Other", value: "other" },
];

export default function CreateIssueScreen({ navigation }) {
  const { session } = useContext(AuthContext);
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const scrollRef = useRef();
  const mapRef = useRef();

  // ✅ Get current location
  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow location access to use this feature."
        );
        setLoadingLocation(false);
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(coords);

      // Animate map to current location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      Alert.alert("Success", "Current location set!");
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Failed to get current location. Please try again.");
    } finally {
      setLoadingLocation(false);
    }
  };

  // ✅ Pick image from gallery
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow gallery access.");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: "images",
        quality: 0.7,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        setImageUri(res.assets[0].uri);
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          300
        );
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // ✅ Take photo with camera
  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission required", "Please allow camera access.");
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        setImageUri(res.assets[0].uri);
        setTimeout(
          () => scrollRef.current?.scrollToEnd({ animated: true }),
          300
        );
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  // ✅ Remove image
  const removeImage = () => {
    setImageUri(null);
  };

  // ✅ Upload image to Supabase
  const uploadImage = async (uri) => {
    try {
      console.log("Starting image upload for:", uri);

      if (!FileSystem || !FileSystem.readAsStringAsync) {
        throw new Error("FileSystem module not available");
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      console.log("Base64 conversion successful, length:", base64.length);

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `issues/${Date.now()}.${fileExt}`;

      let contentType = "image/jpeg";
      if (fileExt === "png") contentType = "image/png";
      else if (fileExt === "gif") contentType = "image/gif";
      else if (fileExt === "webp") contentType = "image/webp";

      console.log("Uploading to Supabase:", fileName);

      const { data: uploadData, error } = await supabase.storage
        .from("images")
        .upload(fileName, bytes, {
          contentType,
          upsert: false,
        });

      console.log("Upload response:", { uploadData, error });

      if (error) {
        console.error("Supabase upload error:", error);
        Alert.alert("Upload failed", error.message);
        return null;
      }

      const { data } = supabase.storage.from("images").getPublicUrl(fileName);
      console.log("Upload successful, URL:", data.publicUrl);
      return data.publicUrl;
    } catch (e) {
      console.error("Image upload failed:", e);
      Alert.alert("Upload failed", e.message || "Unknown error occurred");
      return null;
    }
  };

  // ✅ Validate form
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a title for the issue.");
      return false;
    }
    if (title.trim().length < 5) {
      Alert.alert("Title Too Short", "Title must be at least 5 characters.");
      return false;
    }
    if (!description.trim()) {
      Alert.alert("Missing Description", "Please enter a description.");
      return false;
    }
    if (!location) {
      Alert.alert(
        "Missing Location",
        "Please select a location on the map or use current location."
      );
      return false;
    }
    if (!category) {
      Alert.alert("Missing Category", "Please select a category.");
      return false;
    }
    return true;
  };

  // ✅ Submit issue handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    let image_url = null;

    try {
      if (imageUri) {
        image_url = await uploadImage(imageUri);
        if (!image_url) {
          setLoading(false);
          return;
        }
      }

      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert("Auth error", "Please log in again.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("issues").insert([
        {
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          category,
          image_url,
          latitude: location.latitude,
          longitude: location.longitude,
          upvotes: 0,
          status: "open",
        },
      ]);

      if (error) throw error;

      Alert.alert("✅ Success", "Issue submitted successfully!", [
        {
          text: "OK",
          onPress: () => {
            setTitle("");
            setDescription("");
            setCategory("general");
            setImageUri(null);
            setLocation(null);
            navigation.navigate("Feed");
          },
        },
      ]);
    } catch (e) {
      console.error("Submit error:", e);
      Alert.alert("Submit failed", e.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Get selected category label
  const getSelectedCategoryLabel = () => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat ? cat.label : "Select Category";
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          padding: 16,
          backgroundColor: theme.colors.background,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Title style={{ marginBottom: 6 }}>Report an Issue</Title>
        <Paragraph style={{ marginBottom: 12, color: theme.colors.outline }}>
          Help improve your community by reporting local issues.
        </Paragraph>

        <Card style={{ marginBottom: 12 }}>
          <Card.Content>
            {/* Title Input */}
            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={{ marginBottom: 4 }}
              placeholder="Brief description of the issue"
              maxLength={100}
            />
            <HelperText type="info" visible={true}>
              {title.length}/100 characters
            </HelperText>

            {/* Category Selector */}
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCategoryMenuVisible(true)}
                  icon="tag"
                  style={{ marginBottom: 12 }}
                  contentStyle={{ justifyContent: "flex-start" }}
                >
                  {getSelectedCategoryLabel()}
                </Button>
              }
            >
              {CATEGORIES.map((cat) => (
                <Menu.Item
                  key={cat.value}
                  onPress={() => {
                    setCategory(cat.value);
                    setCategoryMenuVisible(false);
                  }}
                  title={cat.label}
                  leadingIcon={category === cat.value ? "check" : undefined}
                />
              ))}
            </Menu>

            {/* Description Input */}
            <TextInput
              label="Description *"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={{ marginBottom: 4 }}
              placeholder="Describe the issue in detail..."
              maxLength={500}
            />
            <HelperText type="info" visible={true}>
              {description.length}/500 characters
            </HelperText>

            {/* Image Picker Buttons */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <Button
                mode="outlined"
                onPress={pickImage}
                icon="image"
                style={{ flex: 1 }}
              >
                Gallery
              </Button>
              <Button
                mode="outlined"
                onPress={takePhoto}
                icon="camera"
                style={{ flex: 1 }}
              >
                Camera
              </Button>
            </View>

            {/* Image Preview */}
            {imageUri && (
              <View style={{ position: "relative", marginBottom: 12 }}>
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: "100%",
                    height: 220,
                    borderRadius: 8,
                  }}
                  resizeMode="cover"
                />
                <IconButton
                  icon="close-circle"
                  size={30}
                  iconColor="white"
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.5)",
                  }}
                  onPress={removeImage}
                />
              </View>
            )}

            {/* Location Section */}
            <View style={{ marginBottom: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Paragraph style={{ fontWeight: "bold" }}>
                  Location * {location && "✓"}
                </Paragraph>
                <Button
                  mode="contained-tonal"
                  onPress={getCurrentLocation}
                  icon="crosshairs-gps"
                  loading={loadingLocation}
                  disabled={loadingLocation}
                  compact
                >
                  Current
                </Button>
              </View>

              <HelperText type="info" visible={!location}>
                Tap on the map or use current location
              </HelperText>

              <View
                style={{
                  height: 240,
                  borderRadius: 8,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
              >
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: 27.7,
                    longitude: 85.3,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  onPress={(e) => setLocation(e.nativeEvent.coordinate)}
                >
                  {location && (
                    <Marker coordinate={location} title="Issue Location" />
                  )}
                </MapView>
              </View>

              {location && (
                <Chip
                  icon="map-marker"
                  style={{ marginTop: 8, alignSelf: "flex-start" }}
                  mode="outlined"
                >
                  {location.latitude.toFixed(4)},{" "}
                  {location.longitude.toFixed(4)}
                </Chip>
              )}
            </View>

            {/* Loading Indicator */}
            {loading && (
              <ActivityIndicator
                animating={true}
                style={{ marginVertical: 12 }}
              />
            )}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              disabled={loading}
              icon="send"
              style={{ marginTop: 8 }}
            >
              {loading ? "Submitting..." : "Submit Issue"}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
