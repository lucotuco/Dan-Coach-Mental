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
};


const quickActions: QuickAction[] = [
  {
    key: 'checks',
    title: 'Chequeos',
    subtitle: 'Seguimiento diario',
    icon: 'clipboard',
    accent: '#4c6ef5',
  },
  {
    key: 'sessions',
    title: 'Sesiones',
    subtitle: 'Próxima cita',
    icon: 'headphones',
    accent: '#f76707',
  },
  {
    key: 'progress',
    title: 'Progreso',
    subtitle: 'Tus métricas',
    icon: 'trending-up',
    accent: '#20c997',
  },
  {
    key: 'library',
    title: 'Biblioteca',
    subtitle: 'Recursos guiados',
    icon: 'book-open',
    accent: '#845ef7',
  },
  {
    key: 'profile',
    title: 'Perfil',
    subtitle: 'Ajustes y datos',
    icon: 'user',
    accent: '#fd7e14',
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
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.tilesGrid}>
          {quickActions.map((action) => (
            <DashboardTile
              key={action.key}
              icon={action.icon}
              title={action.title}
              subtitle={action.subtitle}
              accentColor={action.accent}
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
    gap: 16,
  },
});
