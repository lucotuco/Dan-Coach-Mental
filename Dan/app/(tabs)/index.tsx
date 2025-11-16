import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet,Image } from 'react-native';

import { Feather as FeatherIcon } from '@expo/vector-icons';

import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import CircularIconButton from '@/components/CircularIconButton';
import DashboardTile from '@/components/DashboardTile';
import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';


const user = {
  name: 'Lucas Schlez',
};

type QuickAction = {
  key: string;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof FeatherIcon>['name'];
  accent: string;
  wrapped?: boolean;
};


const quickActions: QuickAction[] = [
  {
    key: '/checkups',
    title: 'Chequeos Diarios',
    subtitle: 'Controla tu energia, motivación y emociones',
    icon: 'sun',
    accent: '#4c6ef5',
    wrapped: true,
  },
  {
    key: 'sessions',
    title: 'Sesiones con tu coach',
    subtitle: 'sesion en tiempo real Dan, tu coach mental deportivo',
    icon: 'headphones',
    accent: '#f76707',
    wrapped: true,
  },
  {
    key: 'progress',
    title: 'Mi progreso',
    subtitle: 'Seguimiento y evolcuion mental personalizada',
    icon: 'trending-up',
    accent: '#20c997',
    wrapped: false,
  },
  {
    key: '/library',
    title: 'Recursos guiados',
    subtitle: 'Respiracion, relajacion y mas',
    icon: 'book-open',
    accent: '#845ef7',
    wrapped: false,
  },
];

export default function HomeScreen() {
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const primaryColor = useThemeColor({ light: '#031355ff', dark: '#748ffc' }, 'tint');

  return (
    
    <ScrollView style={[styles.container, { backgroundColor },]} contentContainerStyle={styles.content}>

      <MedioLogo/>
      
      <Link href="/profile">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Buenos días,</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>¿Listo para continuar con tu plan?</Text>
        </View>        
        <Avatar name={user.name} size={56} />
      </View>
      </Link>

      <View style={styles.tilesWrapper}>
        <Text style={styles.sectionTitle}>Entrena tu mente, potenciá tu rendimiento </Text>
        <View style={styles.tilesGrid}>
          {quickActions.map((action) => (
            <DashboardTile
              key={action.key}
              icon={action.icon}
              title={action.title}
              subtitle={action.subtitle}
              accentColor={action.accent}
              wrapped={action.wrapped}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  espacio: {
    marginTop: 30,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  dailyCheckCard: {
    gap: 20,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaCard: {
    padding: 20,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ctaText: {
    flex: 1,
    gap: 4,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  ctaButton: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tilesWrapper: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  tilesGrid: {
    flexDirection: 'row',
     flexWrap: 'wrap',
    gap: 20,
  },
});
