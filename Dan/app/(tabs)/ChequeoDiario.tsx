import { StyleSheet, ScrollView, Modal, View } from 'react-native';
import { Button } from 'react-native-paper';
import { Text } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import Slider from '@react-native-community/slider';
import { ComponentProps, useState } from 'react';
import Card from '@/components/Card';
import React from 'react';
import { Link } from 'expo-router';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import RecordingButton from '@/components/AudioRecorderButton';
export default function CheckupsScreen() {
  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0, 0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalLink, setModalLink] = useState('index');
  const [modalBackgroundColor, setModalBackgroundColor] = useState('#fff');
  const [modalTitle, setModalTitle] = useState('Chequeo Diario');
  const [modalIconName, setModalIconName] = useState<ComponentProps<typeof FeatherIcon>['name']>('check-circle');
  const [modalAccentColor, setModalAccentColor] = useState('#1d1564');
  
  const sliderMessages = [
    'Parece que tu energía está un poco baja. Considera tomar un descanso y recargar fuerzas.',
    'Tu motivación necesita un impulso hoy. Piensa en algo que te inspire o te anime.',
    'Tu estado emocional está sensible. Dedica unos minutos a respirar y enfocarte en ti.',
    'El descanso es clave. Intenta priorizar el sueño para recuperar tu bienestar.',
    'Detectamos algo de dolor o molestia. Te recomendamos un ejercicio guiado para aliviarlo.',
  ];
  const sliderRoutes = [
    '/energia',
    '/motivacion',
    '/estado-emocional',
    '/sueno',
    '/dolor',
  ];

  const fecha = new Date();
  const fechaFormateada = fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleSliderChange = (value: number, index: number) => {
    const newValues = [...sliderValues];
    newValues[index] = value;
    setSliderValues(newValues);
  };

   const modalBackgroundColors = [
    '#97dfcb',
    '#fff3e7',
    '#ebffe4',
    '#ddccf5',
    '#fff4e2',
  ];

  const modalAccentColors = [
    '#1d1564',
    '#c00a0a',
    '#16800c',
    '#31a9c7',
    '#fda531',
  ];

  const modalTitles = [
    'Tu energía está baja',
    'Tu motivación está baja',
    'Tu estado emocional necesita atención',
    'Tu descanso fue insuficiente',
    'Detectamos molestias en tu cuerpo',
  ];

  const modalIcons: ComponentProps<typeof FeatherIcon>['name'][] = [
    'zap',
    'target',
    'heart',
    'moon',
    'alert-triangle',
  ];
  const handleSubmit = () => {
    const newValues = [...sliderValues];
    const lowIndex = newValues
      .map((value, index) => (value < 6 ? index : null))
      .find((index): index is number => index !== null);

    const feedbackOptions = [
      {
        message: '¡Todo bien! Sigue así, estás cuidando muy bien tu bienestar.',
        href: 'Homepage',
      },
      ...sliderMessages.map((message, index) => ({
        message,
        href: sliderRoutes[index],
      })),
    ];

    const selectedFeedback = feedbackOptions[(lowIndex ?? -1) + 1];
    const selectedBackground =
      typeof lowIndex === 'number' ? modalBackgroundColors[lowIndex] : '#fff';
    const selectedTitle =
      typeof lowIndex === 'number' ? modalTitles[lowIndex] : 'Chequeo Diario';
    const selectedIcon =
      typeof lowIndex === 'number' ? modalIcons[lowIndex] : 'check-circle';
    const selectedAccent =
      typeof lowIndex === 'number' ? modalAccentColors[lowIndex] : '#1d1564';
    setModalMessage(selectedFeedback.message);
    setModalLink(selectedFeedback.href);
    setModalBackgroundColor(selectedBackground);
    setModalTitle(selectedTitle);
    setModalIconName(selectedIcon);
    setModalAccentColor(selectedAccent);
    setModalVisible(true);
    setSliderValues([0, 0, 0, 0, 0]);
  };

  return (
    <ScrollView style={[styles.container, {'backgroundColor': '#fff'},]} contentContainerStyle={styles.content}>
         <MedioLogo/>
         <Text style={{fontSize:20, fontWeight:'700', color:'#1d1564',marginBottom:-20, alignItems: 'center',justifyContent:'center' }}>Chequeo Diario del dia: </Text>
         <Text style={{fontSize:16, fontWeight:'600', color:'#1d1564',  alignItems: 'center',justifyContent:'center' }}>{fechaFormateada}</Text>
         <Card>
             <Text style={styles.sliderLabel}>Energía :</Text>
             <Slider 
               style={{width: 270, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#1d1564ff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#1d1564ff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 0)}
               value={0}
             />

             <Text style={styles.sliderLabel}>Motivación :</Text>
             <Slider 
               style={{width: 270, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#c00a0aff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#c00a0aff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 1)}
               value={0}
             />

             <Text style={styles.sliderLabel}>Estado Emocional:</Text>
             <Slider 
               style={{width: 270, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#16800cff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#16800cff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 2)}
               value={0}
             />

             <Text style={styles.sliderLabel}>Sueño :</Text>
             <Slider 
               style={{width: 270, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#31a9c7ff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#31a9c7ff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 3)}
               value={0}
             />
             <Text style={styles.sliderLabel}>Dolor o Molestia:</Text>
             <Slider 
               style={{width: 270, height: 40}}
               minimumValue={0}
               maximumValue={10}
               minimumTrackTintColor="#fda531ff"
               maximumTrackTintColor="#949494ff"
               step={1}
               tapToSeek={true}
               thumbTintColor='#fda531ff'
               testID='1'
               onValueChange={(value) => handleSliderChange(value, 4)}
               value={0}
             />
            
         </Card>
         <View style={{alignContent:'center', alignItems:'center', marginTop:-17,marginBottom:-17,}}>
             <RecordingButton />
          </View>

         <Button
           mode="contained"
           style={{ backgroundColor:'#1d1564ff'}}
           onPress={handleSubmit}
         >
            <Text style={{color:'#ffffffff',fontSize:20, fontWeight:'600'}}>Guardar Chequeo</Text>
         </Button>

         <Modal
           visible={modalVisible}
           animationType="fade"
           transparent
           onRequestClose={() => setModalVisible(false)}
         >
           <View style={styles.modalBackdrop}>
           <View style={[styles.modalContainer, { backgroundColor: modalBackgroundColor }]}>
            <FeatherIcon name={'x'} size={36} color={'#000000ff'} style={styles.icon} />
               <View style={styles.modalHeader}>
                 <FeatherIcon name={modalIconName} size={36} color={modalAccentColor} />
                 <Text style={[styles.modalTitle, { color: modalAccentColor }]}>{modalTitle}</Text>
               </View>
               <Text style={styles.modalMessage}>{modalMessage}</Text>
              <Link
                href={'(tabs)/'+modalLink}
                asChild
                onPress={() => setModalVisible(false)}
              >
                <Button
                  mode="contained"
                  style={styles.modalButton}
                >
                  <Text style={{color:'#ffffffff',fontSize:16, fontWeight:'600'}}>Ir ahora</Text>
                </Button>
              </Link>
            </View>
          </View>
        </Modal>

    </ScrollView>
  );
}
const styles = StyleSheet.create({
  icon:{
    position: 'absolute',
    top: 6,
    left: -6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  dismissButton: {
    position: 'absolute',
    top: 15,
    left: 290,
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
  audioCard: {
    alignItems: 'center',
  },
  audioHeader: {
    width: '100%',
    marginBottom: 16,
  },
  audioDescription: {
    marginTop: 4,
    lineHeight: 20,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    gap: 16,
    maxHeight: '100%',
    maxWidth:'100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1564',
    flexShrink: 1,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1d1564',
  },
  modalButton: {
    backgroundColor: '#1d1564',
  },
});

