import { StyleSheet, ScrollView, Modal, View,Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import { ComponentProps, useEffect, useState } from 'react';
import Card from '@/components/Card';
import React from 'react';
import { Link } from 'expo-router';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import RecordingButton from '@/components/AudioRecorderButton';
import { useAuth } from '@/components/AuthContext';
import CheckSlider from '@/components/CheckSlider';
export default function CheckupsScreen() {
  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0, 0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalLink, setModalLink] = useState('index');
  const [modalBackgroundColor, setModalBackgroundColor] = useState('#fff');
  const [modalTitle, setModalTitle] = useState('Chequeo Diario');
  const [modalIconName, setModalIconName] = useState<ComponentProps<typeof FeatherIcon>['name']>('check-circle');
  const [modalAccentColor, setModalAccentColor] = useState('#1d1564');
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const todayKey = new Date().toISOString().split('T')[0];
  const { user, isAuthenticated, logout } = useAuth();
  const getDailyCheckStorageKey = () => {
    const userId = user?._id ?? 'guest';
    return `dailyCheckDate:${userId}`;
  };

  const getStoredDailyCheckDate = (storageKey: string) => {
    const maybeLocalStorage = (globalThis as {
      localStorage?: { getItem: (key: string) => string | null };
      dailyCheckDate?: string;
    }).localStorage;

    if (maybeLocalStorage && typeof maybeLocalStorage.getItem === 'function') {
      return maybeLocalStorage.getItem(storageKey);
    }

    if (typeof globalThis !== 'undefined') {
      return (globalThis as { [key: string]: string | undefined })[storageKey] ?? null;
    }

    return null;
  };

  const setStoredDailyCheckDate = (storageKey: string, value: string) => {
    const maybeLocalStorage = (globalThis as {
      localStorage?: { setItem: (key: string, val: string) => void };
      dailyCheckDate?: string;
    }).localStorage;

    if (maybeLocalStorage && typeof maybeLocalStorage.setItem === 'function') {
      maybeLocalStorage.setItem(storageKey, value);
      return;
    }

    if (typeof globalThis !== 'undefined') {
      (globalThis as { [key: string]: string | undefined })[storageKey] = value;
    }
  };
  
  const sliderMessages = [
    'Parece que tu energía está un poco baja. Considera tomar un descanso y recargar fuerzas.',
    'Tu motivación necesita un impulso hoy. Piensa en algo que te inspire o te anime.',
    'Tu estado emocional está sensible. Dedica unos minutos a respirar y enfocarte en ti.',
    'El descanso es clave. Intenta priorizar el sueño para recuperar tu bienestar.',
    'Detectamos algo de dolor o molestia. Te recomendamos un ejercicio guiado para aliviarlo.',
  ];
  const sliderRoutes = [
    '/herramientas/energia',
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

  useEffect(() => {
    const storageKey = getDailyCheckStorageKey();
    const storedDate = getStoredDailyCheckDate(storageKey);

    if (storedDate === todayKey) {
      setHasCompletedToday(true);
      setModalMessage('Ya registraste tu chequeo diario hoy. Vuelve mañana para cargar uno nuevo.');
      setModalLink('checkups');
      setModalBackgroundColor('#ddccf5');
      setModalTitle('Chequeo ya registrado');
      setModalIconName('calendar');
      setModalAccentColor('#1d1564');
      setModalVisible(true);
    } else {
      setHasCompletedToday(false);
      setModalVisible(false);
    }
  }, [todayKey, user?._id]);

  const handleAlreadyCompleted = () => {
    setModalMessage('Ya registraste tu chequeo diario hoy. Vuelve mañana para cargar uno nuevo.');
    setModalLink('checkups');
    setModalBackgroundColor('#ddccf5');
    setModalTitle('Chequeo ya registrado');
    setModalIconName('calendar');
    setModalAccentColor('#1d1564');
    setModalVisible(true);
  };
  const handleSubmit = async () => {
    if (hasCompletedToday) {
      handleAlreadyCompleted();
      return;
    }

    const newValues = [...sliderValues];
    const lowIndex = newValues
      .map((value, index) => (value < 6 ? index : null))
      .find((index): index is number => index !== null);

    const feedbackOptions = [
      {
        message: '¡Todo bien! Sigue así, estás cuidando muy bien tu bienestar.',
        href: 'homePage',
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
    setIsSubmitting(true);

    try {
      const response = await fetch(API_URL+'/api/chequeos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: user?._id,
          fecha: fechaFormateada,
          tipo:'chequeo diario',
          variable1: newValues[0],
          variable2: newValues[1],
          variable3: newValues[2],
          variable4: newValues[3],
          variable5: newValues[4],
        }),
      });
      const data = await response.json();


      setModalMessage(selectedFeedback.message);
      setModalLink(selectedFeedback.href);
      setModalBackgroundColor(selectedBackground);
      setModalTitle(selectedTitle);
      setModalIconName(selectedIcon);
      setModalAccentColor(selectedAccent);
      setModalVisible(true);
      setSliderValues([0, 0, 0, 0, 0]);
      setStoredDailyCheckDate(getDailyCheckStorageKey(), todayKey);
      setHasCompletedToday(true);
    } catch (error) {
      
      setModalMessage('No pudimos guardar tu chequeo. Inténtalo de nuevo en unos minutos.');
      setModalLink('index');
      setModalBackgroundColor('#fff3e7');
      setModalTitle('No pudimos guardar');
      setModalIconName('alert-circle');
      setModalAccentColor('#c00a0a');
      setModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, {'backgroundColor': '#fff'},]} contentContainerStyle={styles.content}>
         <MedioLogo/>
         <Text style={{fontSize:20, fontWeight:'700', color:'#1d1564',marginBottom:-20, alignItems: 'center',justifyContent:'center' }}>Chequeo Diario del dia: </Text>
         <Text style={{fontSize:16, fontWeight:'600', color:'#1d1564',  alignItems: 'center',justifyContent:'center' }}>{fechaFormateada}</Text>
         <Card>
            <View style={{ gap: 16 }}>
              <CheckSlider
                label="Energía"
                description="¿Cómo sentís tu nivel de energía hoy?"
                color="#1d1564ff"
                value={sliderValues[0]}
                onValueChange={(value) => handleSliderChange(value, 0)}
              />
              <CheckSlider
                label="Motivación"
                description="¿Qué tan motivado te sentís para encarar el día?"
                color="#c00a0aff"
                value={sliderValues[1]}
                onValueChange={(value) => handleSliderChange(value, 1)}
              />
              <CheckSlider
                label="Estado emocional"
                description="¿Cómo describirías tu estado emocional ahora mismo?"
                color="#16800cff"
                value={sliderValues[2]}
                onValueChange={(value) => handleSliderChange(value, 2)}
              />
              <CheckSlider
                label="Sueño / descanso"
                description="¿Qué tan bien descansaste anoche?"
                color="#31a9c7ff"
                value={sliderValues[3]}
                onValueChange={(value) => handleSliderChange(value, 3)}
              />
              <CheckSlider
                label="Dolor o molestia"
                description="¿Tenés alguna molestia física hoy?"
                color="#fda531ff"
                value={sliderValues[4]}
                onValueChange={(value) => handleSliderChange(value, 4)}
              />
            </View>
         </Card>
         <View style={{alignContent:'center', alignItems:'center', marginTop:-17,marginBottom:-17,}}>
             <RecordingButton />
          </View>

         <Pressable
          accessibilityRole="button"
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Guardar Chequeo</Text>
        </Pressable>

         <Modal
           visible={modalVisible}
           animationType="fade"
           transparent
           onRequestClose={() => setModalVisible(false)}
         >
           <View style={styles.modalBackdrop}>
           <View style={[styles.modalContainer, { backgroundColor: modalBackgroundColor }]}>
           
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
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.primaryButton,
                    styles.modalButton,
                    pressed && styles.primaryButtonPressed,
                  ]}
                >
                  <Text style={styles.bottonIrAhora}>Ir ahora</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </Modal>

    </ScrollView>
  );
}
const styles = StyleSheet.create({
  bottonIrAhora:{
color: '#000000ff',
    fontSize: 16,
    fontWeight: '700',
  },
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
    backgroundColor: '#1d1564',
  },
  primaryButtonPressed: {
    opacity: 0.85,
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

