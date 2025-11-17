import { StyleSheet, ScrollView, Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import React from 'react';
import { Text } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import { useState } from 'react';
import Card from '@/components/Card';
import { FontAwesome5 } from '@expo/vector-icons';

export default function Checkups() {
  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0, 0]);

  const handleSliderChange = (value: number, index: number) => {
    const newValues = [...sliderValues];
    newValues[index] = value;
    setSliderValues(newValues);
  };

  return (
    <ScrollView style={[styles.container, { 'backgroundColor': '#fff' },]} contentContainerStyle={styles.content}>
      <MedioLogo />
      <Text style={{ fontSize: 30, fontWeight: '700', color: '#1d1564', marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>Chequeos</Text>
      <Card style={styles.card}>
        <Link href="/ChequeoDiario">
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <FontAwesome5 name="clipboard-list" size={32} color="#1d1564" />
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.cardTitle}>Chequeo Diario</Text>
              <Text style={styles.cardDescription}>Hacé un chequeo rápido de tu estado físico y mental: sueño, energía, motivación, emociones y molestias. Tu termómetro diario como deportista.</Text>
            </View>
          </View>
        </Link>
      </Card>
      <Card style={styles.card}>
        <Link href="/ChequeoDiario">
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <FontAwesome5 name="clipboard-list" size={32} color="#1d1564" />
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.cardTitle}>Chequeo Diario</Text>
              <Text style={styles.cardDescription}>Hacé un chequeo rápido de tu estado físico y mental: sueño, energía, motivación, emociones y molestias. Tu termómetro diario como deportista.</Text>
            </View>
          </View>
        </Link>
      </Card>
      <Card style={styles.card}>
        <Link href="/ChequeoDiario">
          <View style={styles.cardHeader}>
            <View style={styles.iconWrapper}>
              <FontAwesome5 name="clipboard-list" size={32} color="#1d1564" />
            </View>
            <View style={styles.headerTextWrapper}>
              <Text style={styles.cardTitle}>Chequeo Diario</Text>
              <Text style={styles.cardDescription}>Hacé un chequeo rápido de tu estado físico y mental: sueño, energía, motivación, emociones y molestias. Tu termómetro diario como deportista.</Text>
            </View>
          </View>
        </Link>
      </Card>

    </ScrollView>
  );
}
const styles = StyleSheet.create({
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
