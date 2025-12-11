import { StyleSheet, ScrollView, Modal, View,Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import { ComponentProps, useEffect, useState } from 'react';
import Card from '@/components/Card';
import React from 'react';
import { Link, useRouter } from 'expo-router';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import RecordingButton from '@/components/AudioRecorderButton';
import { useAuth } from '@/components/AuthContext';
import CheckSlider from '@/components/CheckSlider';
import { getStoredToken, isUnauthorizedStatus, redirectToLogin } from '@/components/AuthContext';
export default function CheckupsScreen() {
  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0, 0]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalLink, setModalLink] = useState('index');
  const [modalBackgroundColor, setModalBackgroundColor] = useState('#fff');
  const [modalTitle, setModalTitle] = useState('Chequeo pre competencia');
  const [modalIconName, setModalIconName] = useState<ComponentProps<typeof FeatherIcon>['name']>('check-circle');
  const [modalAccentColor, setModalAccentColor] = useState('#1d1564');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const sliderMessages = [
    'Tu energía de salida está por debajo de lo ideal. Activá con una rutina breve antes de competir.',
    'La motivación previa es baja. Revisá tu porqué y visualizá cómo querés rendir hoy.',
    'La concentración está dispersa. Tomate un momento para respirar y definir tu foco de la competencia.',
    'Tus emociones previas están intensas. Regulá con una pausa consciente antes de entrar.',
    'Tu diálogo interno suena exigente. Cambiá a mensajes de apoyo para encarar la competencia.',
  ];
  const sliderRoutes = [
    '/herramientas/estadoEmocional',
    '/library',
    '/library',
    '/library',
    '/library',
  ];

  const fecha = new Date();
  const fechaISO = fecha.toISOString();
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
    'Tu energía previa está baja',
    'Tu motivación previa necesita impulso',
    'Tu concentración está dispersa',
    'Tus emociones necesitan regulación',
    'Tu diálogo interior necesita apoyo',

  ];

  const modalIcons: ComponentProps<typeof FeatherIcon>['name'][] = [
    'zap',
    'target',
    'heart',
    'moon',
    'alert-triangle',
  ];

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const newValues = [...sliderValues];
    const lowIndex = newValues
      .map((value, index) => (value < 6 ? index : null))
      .find((index): index is number => index !== null);

    const feedbackOptions = [
      {
        message: '¡Listo para competir! Tu preparación mental está en buen nivel.',
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
      typeof lowIndex === 'number' ? modalTitles[lowIndex] : 'Chequeo pre competencia';
    const selectedIcon =
      typeof lowIndex === 'number' ? modalIcons[lowIndex] : 'check-circle';
    const selectedAccent =
      typeof lowIndex === 'number' ? modalAccentColors[lowIndex] : '#1d1564';
    setIsSubmitting(true);

    try {
    if (!API_URL) {
      throw new Error('No se encontró la URL de la API (EXPO_PUBLIC_API_URL).');
    }
    if (!user?._id) {
      throw new Error('No se encontró el usuario (owner).');
    }

    const formData = new FormData();
    formData.append('owner', String(user._id));
    formData.append('fecha', fechaISO);
    formData.append('tipo', 'chequeo post');

    formData.append('variable1', String(newValues[0]));
    formData.append('variable2', String(newValues[1]));
    formData.append('variable3', String(newValues[2]));
    formData.append('variable4', String(newValues[3]));
    formData.append('variable5', String(newValues[4]));

    if (audioUri) {
      formData.append('audio', {
        uri: audioUri,
        name: 'chequeo-pre.m4a',
        type: 'audio/m4a',
      } as any);
    }

    const token = getStoredToken();

    if (!token) {
      redirectToLogin(router, logout);
      return;
    }

    const response = await fetch(API_URL + '/api/chequeos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (isUnauthorizedStatus(response.status)) {
      redirectToLogin(router, logout);
      return;
    }

    if (!response.ok) {
      throw new Error(data?.message || 'Error al guardar el chequeo');
    }

      setModalMessage(selectedFeedback.message);
      setModalLink(selectedFeedback.href);
      setModalBackgroundColor(selectedBackground);
      setModalTitle(selectedTitle);
      setModalIconName(selectedIcon);
      setModalAccentColor(selectedAccent);
      setModalVisible(true);
      setSliderValues([0, 0, 0, 0, 0, 0]);
      setAudioUri(null);
    } catch (error) {
      console.error('Error guardando chequeo diario', error);
      setModalMessage(
        error instanceof Error && error.message
          ? error.message
          : 'No pudimos guardar tu chequeo. Inténtalo de nuevo en unos minutos.',
      );
      setModalLink('/');
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
         <Text style={{fontSize:20, fontWeight:'700', color:'#1d1564',marginBottom:-20, alignItems: 'center',justifyContent:'center' }}>Como esta tu mente antes de competir?: </Text>
         <Text style={{fontSize:16, fontWeight:'600', color:'#1d1564',  alignItems: 'center',justifyContent:'center' }}>{fechaFormateada}</Text>
         <Card>
            <View style={{ gap: 16 }}>
              <CheckSlider
                label="Energía"
                description="¿Cómo está tu nivel de energía para competir?"
                color="#1d1564ff"
                value={sliderValues[0]}
                onValueChange={(value) => handleSliderChange(value, 0)}
              />
              <CheckSlider
                label="Motivación"
                description="¿Qué tan motivado estás para rendir hoy?"
                color="#c00a0aff"
                value={sliderValues[1]}
                onValueChange={(value) => handleSliderChange(value, 1)}
              />
              <CheckSlider
                label="Concentración"
                description="¿Qué tan enfocada sentís tu mente ahora?"
                color="#16800cff"
                value={sliderValues[2]}
                onValueChange={(value) => handleSliderChange(value, 2)}
              />
              <CheckSlider
                label="Estado emocional"
                description="¿Cómo se siente tu estado emocional previo a competir?"
                color="#31a9c7ff"
                value={sliderValues[3]}
                onValueChange={(value) => handleSliderChange(value, 3)}
              />
              <CheckSlider
                label="Diálogo interior"
                description="¿Qué tan positivo o negativo está tu diálogo interior?"
                color="#fda531ff"
                value={sliderValues[4]}
                onValueChange={(value) => handleSliderChange(value, 4)}
              />
            </View>

         </Card>
         <View style={{alignContent:'center', alignItems:'center', marginTop:-17,marginBottom:-17,}}>
             <RecordingButton 
                onRecordingComplete={(uri: string | null) => {
                setAudioUri(uri);
              }}/>
          </View>

         <Pressable
          accessibilityRole="button"
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            isSubmitting && styles.primaryButtonDisabled,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Guardando...' : 'Guardar Chequeo'}
          </Text>
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
  primaryButtonDisabled: {
    opacity: 0.6,
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

