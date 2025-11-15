import type { ComponentProps } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Feather as FeatherIcon } from '@expo/vector-icons';

import Avatar from '@/components/Avatar';
import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

const user = {
  name: 'Lucas Schlez',
};

type QuickLink = {
  key: string;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  icon: ComponentProps<typeof FeatherIcon>['name'];
  backgroundColor: string;
  iconBackground: string;
  iconColor: string;
  textColor: string;
  descriptionColor?: string;
  buttonColor: string;
  buttonTextColor?: string;
};

const quickLinks: QuickLink[] = [
  {
    key: 'checks',
    title: 'Chequeos diarios',
    description: 'Controlá tu energía, motivación y emociones.',
    buttonLabel: 'Iniciar chequeo diario',
    href: '/checkups',
    icon: 'sun',
    backgroundColor: '#d6e4ff',
    iconBackground: 'rgba(255, 255, 255, 0.85)',
    iconColor: '#1b4de5',
    textColor: '#031355',
    descriptionColor: 'rgba(3, 19, 85, 0.85)',
    buttonColor: '#1b4de5',
    buttonTextColor: '#ffffff',
  },
  {
    key: 'chemistry',
    title: 'Activa tu química del rendimiento',
    description: 'Entrená Dopamina, Oxitocina, Endorfina y Serotonina.',
    buttonLabel: 'Acceder al cuarteto',
    href: '/energia',
    icon: 'zap',
    backgroundColor: '#ffe0d1',
    iconBackground: 'rgba(255, 255, 255, 0.85)',
    iconColor: '#f76707',
    textColor: '#712f00',
    descriptionColor: 'rgba(113, 47, 0, 0.85)',
    buttonColor: '#f76707',
    buttonTextColor: '#ffffff',
  },
  {
    key: 'sessions',
    title: 'Sesiones guiadas',
    description: 'Respiración, foco, relajación y visualizaciones.',
    buttonLabel: 'Iniciar sesión guiada',
    href: '/sessions',
    icon: 'headphones',
    backgroundColor: '#ede4ff',
    iconBackground: 'rgba(255, 255, 255, 0.85)',
    iconColor: '#845ef7',
    textColor: '#2f1572',
    descriptionColor: 'rgba(47, 21, 114, 0.85)',
    buttonColor: '#845ef7',
    buttonTextColor: '#ffffff',
  },
  {
    key: 'progress',
    title: 'Mi progreso',
    description: 'Seguimiento de hábitos, logros y objetivos.',
    buttonLabel: 'Ver mi progreso',
    href: '/progress',
    icon: 'trending-up',
    backgroundColor: '#dbe4ff',
    iconBackground: 'rgba(255, 255, 255, 0.85)',
    iconColor: '#4263eb',
    textColor: '#102352',
    descriptionColor: 'rgba(16, 35, 82, 0.85)',
    buttonColor: '#4263eb',
    buttonTextColor: '#ffffff',
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
        <Text style={styles.sectionTitle}>Entrená tu mente, potenciá tu rendimiento.</Text>
        <View style={styles.linksStack}>
          {quickLinks.map((link) => (
            <View key={link.key} style={[styles.linkCard, { backgroundColor: link.backgroundColor }]}>
              <View style={[styles.iconBadge, { backgroundColor: link.iconBackground }]}>
                <FeatherIcon name={link.icon} size={28} color={link.iconColor} />
              </View>
              <Text style={[styles.linkTitle, { color: link.textColor }]}>{link.title}</Text>
              <Text style={[styles.linkDescription, { color: link.descriptionColor ?? link.textColor }]}>
                {link.description}
              </Text>
              <Link href={link.href} asChild>
                <Pressable style={({ pressed }) => [
                  styles.linkButton,
                  { backgroundColor: link.buttonColor },
                  pressed && styles.linkButtonPressed,
                ]}>
                  <Text style={[styles.linkButtonText, { color: link.buttonTextColor ?? '#ffffff' }]}>
                    {link.buttonLabel}
                  </Text>
                </Pressable>
              </Link>
            </View>
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
  linksStack: {
    gap: 16,
  },
  linkCard: {
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  linkDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  linkButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  linkButtonPressed: {
    opacity: 0.85,
  },
});
