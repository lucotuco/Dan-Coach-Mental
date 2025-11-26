import { StyleSheet, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import React from 'react';
import { Text } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

import Card from '@/components/Card';
import { FontAwesome5 } from '@expo/vector-icons';

type CheckupCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  tag: string;
  colors: {
    background: string;
    border: string;
    shadow: string;
    iconBackground: string;
    iconColor: string;
    tagBackground: string;
    tagColor: string;
  };
};

const checkupCards: CheckupCard[] = [
  {
    id: 'daily-check',
    title: 'Chequeo Diario',
    description:
      'Hacé un chequeo rápido de tu estado físico y mental: sueño, energía, motivación, emociones y molestias. Tu termómetro diario como deportista.',
    href: '/ChequeoDiario',
    tag: 'Rutina diaria',
    colors: {
      background: '#b4c2ffff',
      border: '#dce3ff',
      shadow: '#c0ccff',
      iconBackground: '#e1e7ff',
      iconColor: '#2e368f',
      tagBackground: '#e8ecff',
      tagColor: '#2e368f',
    },
  },
  {
    id: 'momentum-check',
    title: 'Chequeo pre competencia',
    description:
      'Hacé un chequeo rápido de tu estado físico y mental: sueño, energía, motivación, emociones y molestias. Tu termómetro diario como deportista.',
    href: '/chequeoPre',
    tag: 'Estado emocional',
    colors: {
      background: '#ffb0baff',
      border: '#ffdce3',
      shadow: '#ffc2cf',
      iconBackground: '#ffe5eb',
      iconColor: '#b9355b',
      tagBackground: '#ffe9ef',
      tagColor: '#b9355b',
    },
  },
  {
    id: 'focus-check',
    title: 'Chequeo post competencia',
    description:
      'Hacé un chequeo rápido de tu estado físico y mental: sueño, energía, motivación, emociones y molestias. Tu termómetro diario como deportista.',
    href: '/chequeoPost',
    tag: 'Seguimiento',
    colors: {
      background: '#cdb0fcff',
      border: '#e3d9ff',
      shadow: '#cfc0ff',
      iconBackground: '#efe7ff',
      iconColor: '#6241c7',
      tagBackground: '#efe7ff',
      tagColor: '#6241c7',
    },
  },
];

export default function Checkups() {
  return (
    <ScrollView style={[styles.container, { 'backgroundColor': '#fff' },]} contentContainerStyle={styles.content}>
      <MedioLogo />
      <Text style={{ fontSize: 30, fontWeight: '700', color: '#1d1564', marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>Chequeos</Text>
      {checkupCards.map((card) => (
        <Card
          key={card.id}
          style={[
            styles.card,
            {
              backgroundColor: card.colors.background,
              borderColor: card.colors.border,
              shadowColor: card.colors.shadow,
            },
          ]}
        >
          <Link href={card.href}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: card.colors.iconBackground }] }>
                <FontAwesome5 name="clipboard-list" size={32} color={card.colors.iconColor} />
              </View>
              <View style={styles.headerTextWrapper}>
                
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
            </View>
          </Link>
        </Card>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
   tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {

  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#eef0fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {

    marginBottom: 15,
    marginTop: -5
  },
  container: {

  },
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#1d1564',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTextWrapper: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1564',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4a4a68',
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
