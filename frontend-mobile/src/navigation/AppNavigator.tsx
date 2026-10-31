import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import WeatherScreen from '../screens/WeatherScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ExamScreen from '../screens/ExamScreen';
import PYQScreen from '../screens/PYQScreen';
import LearningScreen from '../screens/LearningScreen';
import DoubtsScreen from '../screens/DoubtsScreen';
import PlannerScreen from '../screens/PlannerScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import AIFeaturesScreen from '../screens/AIFeaturesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import LocalModelScreen from '../screens/LocalModelScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import {
  CommunityScreen,
  DownloadsScreen,
  ExamInfoScreen,
  MotivationScreen,
  RevisionScreen,
  SettingsScreen,
} from '../screens/InfoScreens';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#3525CD',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{ title: 'Chat', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="LearningTab"
        component={LearningScreen}
        options={{ title: 'Learn', tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="PYQTab"
        component={PYQScreen}
        options={{ title: 'PYQ', tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="DocumentsTab"
        component={DocumentsScreen}
        options={{ title: 'Docs', tabBarIcon: ({ color, size }) => <Ionicons name="folder-open-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#3525CD',
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Learning" component={LearningScreen} />
      <Stack.Screen name="Doubts" component={DoubtsScreen} />
      <Stack.Screen name="Planner" component={PlannerScreen} />
      <Stack.Screen name="Resources" component={ResourcesScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="AIFeatures" component={AIFeaturesScreen} options={{ title: 'AI Tools' }} />
      <Stack.Screen name="LocalModel" component={LocalModelScreen} options={{ title: 'On-Device Model' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="ExamInfo" component={ExamInfoScreen} options={{ title: 'Exam Info' }} />
      <Stack.Screen name="Motivation" component={MotivationScreen} />
      <Stack.Screen name="Revision" component={RevisionScreen} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="ExamAssistant" component={ExamScreen} options={{ title: 'Exam Assistant' }} />
    </Stack.Navigator>
  );
}
