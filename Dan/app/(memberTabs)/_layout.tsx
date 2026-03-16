import React from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { createSharedHeaderOptions, withoutBackButton } from '@/constants/navigation';

export function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  color: string;
}) {
  return <FontAwesome5 size={20} style={{ marginBottom: -2 }} {...props} />;
}

export default function MemberTabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const sharedHeaderOptions = React.useMemo(
    () => createSharedHeaderOptions(theme),
    [theme],
  );

  return (
    <Tabs
      screenOptions={{
        ...sharedHeaderOptions,
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: 'transparent',
          elevation: 0,
          paddingVertical: 2,
          height: 52,
        },
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
  name="homeMembers"
  options={{
    title: 'home',
    tabBarLabel: '',
    tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
    ...withoutBackButton,
  }}
/>
<Tabs.Screen
  name="dan"
  options={{
    title: 'DAN',
    tabBarLabel: '',
    tabBarIcon: ({ color }) => <TabBarIcon name="comment-dots" color={color} />,
  }}
/>

<Tabs.Screen
  name="checkin"
  options={{
    title: 'Chequeo',
    tabBarLabel: '',
    tabBarIcon: ({ color }) => <TabBarIcon name="clipboard-check" color={color} />,
  }}
/>

<Tabs.Screen
  name="progress"
  options={{
    title: 'Progreso',
    tabBarLabel: '',
    tabBarIcon: ({ color }) => <TabBarIcon name="chart-line" color={color} />,
  }}
/>

<Tabs.Screen
  name="tools"
  options={{
    title: 'Herramientas',
    tabBarLabel: '',
    tabBarIcon: ({ color }) => <TabBarIcon name="dumbbell" color={color} />,
  }}
/>

<Tabs.Screen
  name="plan"
  options={{
    title: 'Plan',
    tabBarLabel: '',
    tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
  }}
/>
    </Tabs>
  );
}