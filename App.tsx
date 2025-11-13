// App.tsx
import React, { useEffect, useState } from "react";
import { AuthContext } from "./contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { supabase } from "./supabaseClient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import HomeScreen from "./screens/HomeScreen";
import CreateIssueScreen from "./screens/CreateIssueScreen";
import IssueDetailsScreen from "./screens/IssueDetailsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AdminDashboard from "./screens/AdminDashboard";
import UserManagement from "./screens/UserManagement";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
  const [isAdmin, setIsAdmin] = useState(false);
  const { session } = React.useContext(AuthContext);

  useEffect(() => {
    checkAdminStatus();
  }, [session]);

  const checkAdminStatus = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();
    setIsAdmin(data?.is_admin || false);
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Feed")
            return <Icon name="view-list" color={color} size={size} />;
          if (route.name === "Create")
            return <Icon name="plus-box" color={color} size={size} />;
          if (route.name === "Profile")
            return <Icon name="account" color={color} size={size} />;
          if (route.name === "Admin")
            return <Icon name="shield-account" color={color} size={size} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Feed" component={HomeScreen} />
      <Tab.Screen name="Create" component={CreateIssueScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminDashboard}
          options={{
            tabBarBadge: "!",
            tabBarBadgeStyle: { backgroundColor: "#F44336" },
          }}
        />
      )}
    </Tab.Navigator>
  );
}

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#0b8457", // green-ish
    accent: "#ffd54f",
  },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn("auth getSession error", error.message);
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <AuthContext.Provider value={{ session }}>
        <NavigationContainer>
          <Stack.Navigator>
            {!session ? (
              <>
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="Signup" component={SignupScreen} />
              </>
            ) : (
              <>
                <Stack.Screen
                  name="Main"
                  component={AppTabs}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="IssueDetails"
                  component={IssueDetailsScreen}
                  options={{ title: "Issue Details" }}
                />
                <Stack.Screen
                  name="UserManagement"
                  component={UserManagement}
                  options={{ title: "User Management" }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    </PaperProvider>
  );
}
