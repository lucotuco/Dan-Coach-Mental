import { StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import React from 'react';
import { Text, View } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import { useState } from 'react';
import Card from '@/components/Card';
import { FontAwesome5 } from '@expo/vector-icons';

export default function CheckupsScreen() {
  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0, 0]);

  const handleSliderChange = (value: number, index: number) => {
    const newValues = [...sliderValues];
    newValues[index] = value;
    setSliderValues(newValues);
  };

  return (
    <ScrollView style={[styles.container, {'backgroundColor': '#fff'},]} contentContainerStyle={styles.content}>
         <MedioLogo/>
         <Text style={{fontSize:30, fontWeight:'700', color:'#1d1564', marginBottom:10, alignItems: 'center',justifyContent:'center' }}>Chequeos</Text>
          <Card>
            <Link href="/ChequeoDiario">
              <View style={styles.cardHeader}/>
              <FontAwesome5 name="clipboard-list" size={40} color="#1d1564" style={styles.icon}/>
              
              <Text style={styles.cardTitle}>Chequeo Diario:</Text>
              <Text style={styles.cardDescription}>Hacé un chequeo rápido de tu estado físico y mental: sueño, energía, motivación, emociones y molestias. Tu termómetro diario como deportista.</Text>
            </Link>
          </Card>
          
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  icon: {
    position: 'absolute',
    top: 6,
    left: -20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  container: {
    flex: 1,
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
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingRight:1000,
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
