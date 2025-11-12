import { StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import React from 'react';
import { Text, View } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import Slider from '@react-native-community/slider';
import { useState } from 'react';
import Card from '@/components/Card';

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
         <Text style={{fontSize:30, fontWeight:'700', color:'#1d1564', marginBottom:10, alignItems: 'center', paddingLeft:50}}>Chequeo Diario</Text>
          <Card>
             <Text style={styles.sliderLabel}>Energía :</Text>
             <Slider 
               style={{width: 300, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#1d1564ff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#1d1564ff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 0)}
             />

             <Text style={styles.sliderLabel}>Motivación :</Text>
             <Slider 
               style={{width: 300, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#1d1564ff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#1d1564ff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 1)}
             />

             <Text style={styles.sliderLabel}>Estado Emocional:</Text>
             <Slider 
               style={{width: 300, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#1d1564ff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#1d1564ff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 2)}
             />

             <Text style={styles.sliderLabel}>Sueño :</Text>
             <Slider 
               style={{width: 300, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#1d1564ff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#1d1564ff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 3)}
             />
             <Text style={styles.sliderLabel}>Dolor o Molestia:</Text>
             <Slider 
               style={{width: 300, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#1d1564ff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#1d1564ff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 4)}
             />
         </Card>

          <Button mode="contained" style={{marginTop:20, backgroundColor:'#1d1564ff'}} onPress={() => console.log('Guardar Chequeo ', sliderValues[0], sliderValues[1], sliderValues[2], sliderValues[3], sliderValues[4])}>
            <Text style={{color:'#ffffffff',fontSize:20, fontWeight:'600'}}>Guardar Chequeo</Text>
          </Button>
          
    </ScrollView>
  );
}
const styles = StyleSheet.create({
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
