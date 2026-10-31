import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, ScreenShell, theme } from '../components/MobileScaffold';
import { notificationApi, NotificationItem } from '../services/api';

function targetRoute(actionRoute: string | null): string | null {
  switch (actionRoute) {
    case '/revision-planner':
      return 'Planner';
    case '/pyq':
      return 'PYQTab';
    case '/exam-info':
      return 'ExamInfo';
    case '/motivation':
      return 'Motivation';
    case '/progress':
      return 'Progress';
    case '/resources':
      return 'Resources';
    case '/learning':
      return 'Learning';
    default:
      return null;
  }
}

export default function NotificationsScreen({ navigation }: { navigation: any }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await notificationApi.list();
      setItems(data.notifications);
      setUnread(data.unread_count);
      setError('');
    } catch {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function open(item: NotificationItem) {
    try {
      if (!item.read) {
        const data = await notificationApi.markRead(item.notification_id);
        setItems(data.notifications);
        setUnread(data.unread_count);
      }
    } catch {}
    const route = targetRoute(item.action_route);
    if (route === 'PYQTab') navigation.navigate('MainTabs', { screen: 'PYQTab' });
    else if (route) navigation.navigate(route);
  }

  async function markAllRead() {
    setSaving(true);
    try {
      const data = await notificationApi.markAllRead();
      setItems(data.notifications);
      setUnread(data.unread_count);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell
      title="Notifications"
      subtitle={`${unread} unread study alerts`}
      right={
        <TouchableOpacity style={local.headerButton} onPress={markAllRead} disabled={!unread || saving}>
          <Ionicons name="checkmark-done-outline" size={20} color={!unread ? theme.muted : theme.primary} />
        </TouchableOpacity>
      }
    >
      {loading ? (
        <View style={local.center}><ActivityIndicator color={theme.primary} size="large" /></View>
      ) : error ? (
        <View style={local.center}><Text style={local.error}>{error}</Text></View>
      ) : items.length === 0 ? (
        <View style={local.empty}><EmptyState title="No notifications yet" subtitle="Planner reminders, daily practice, and exam updates will appear here." /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.notification_id}
          contentContainerStyle={local.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={[local.row, !item.read && local.unread]} onPress={() => open(item)}>
              <View style={[local.dot, item.read ? local.dotRead : local.dotUnread]} />
              <View style={{ flex: 1 }}>
                <View style={local.rowTop}>
                  <Text style={local.title}>{item.title}</Text>
                  {item.priority === 'high' ? <Text style={local.priority}>High</Text> : null}
                </View>
                <Text style={local.message}>{item.message}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.muted} />
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenShell>
  );
}

const local = StyleSheet.create({
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primaryFixed },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { padding: 16 },
  error: { color: theme.danger, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 14, marginBottom: 10 },
  unread: { backgroundColor: theme.primaryFixed, borderColor: theme.outline },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotRead: { backgroundColor: theme.outline },
  dotUnread: { backgroundColor: theme.primary },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  title: { flex: 1, color: theme.text, fontSize: 14, fontWeight: '900' },
  priority: { color: theme.danger, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  message: { color: theme.muted, fontSize: 12, lineHeight: 18 },
});
