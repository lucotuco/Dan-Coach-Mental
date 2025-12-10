import React from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { createSharedHeaderOptions , withoutBackButton } from '@/constants/navigation';

export function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome5>['name'];
  color: string;
}) {
  return <FontAwesome5 size={24} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
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
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: 'transparent',
          elevation: 0,
          paddingVertical: 6,
        },
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="homePage"
        options={{
          title: 'Inicio',
          tabBarLabel: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          ...withoutBackButton,
        }}
      />
      <Tabs.Screen
        name="checkups"
        options={{
          title: 'Chequeos',
          tabBarLabel: '',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="clipboard-check" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sesions"
        options={{
          title: 'Sesiones',
          tabBarLabel: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="comment-alt" color={color} />,
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
        name="entrenamientosPersonales"
        options={{
          title: 'Entrenamientos Personales',
          tabBarLabel: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="dumbbell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ejerciciosGuiados"
        options={{
          title: 'Ejercicios Guiados',
          tabBarLabel: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="headphones" color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Biblioteca',
          tabBarLabel: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
        }}
      />
      
      
      <Tabs.Screen
        name="chequeoDiario"
        options={{
          href: null,
          
        }}
      />
      <Tabs.Screen
        name="chequeoPost"
        options={{
          href: null,
          
        }}
      />
      <Tabs.Screen
        name="chequeoPre"
        options={{
          href: null,
          
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          
        }}
      />
      <Tabs.Screen
        name="coachVirtual"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dolor"
        options={{
          href: null,
          
        }}
      />
      <Tabs.Screen
        name="herramientas/estadoEmocional"
        options={{
          href: null,
          }}
      />
      <Tabs.Screen
        name="herramientas/renovarEnergia"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="herramientas/vitalidadMinutos"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="estado-emocional"
        options={{
          href: null,
          
        }}
      />
      <Tabs.Screen
        name="motivacion"
        options={{
          href: null,
          
        }}
      />
      <Tabs.Screen
        name="sueno"
        options={{
          href: null,
          
        }}
      />

    </Tabs>
  );
}
