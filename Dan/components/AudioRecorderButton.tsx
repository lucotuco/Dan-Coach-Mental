import { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable, Text } from 'react-native';
import {useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState, createAudioPlayer} from 'expo-audio';
import { FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

export default function RecordingButton() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [modalVisible, setModalVisible] = useState(false);
  const record = async () => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };
  const stopRecording = async () => {
    // The recording will be available on `audioRecorder.uri`.
    await audioRecorder.stop();
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  };
  const player = createAudioPlayer(audioRecorder.uri);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        alert('Permission to access microphone was denied');
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isDarkMode = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        //allowSwipeDismissal ={true}
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              { borderColor: palette.tint, backgroundColor: isDarkMode ? '#181818' : '#fff' },
            ]}>
            <View style={[styles.modalHeader, { backgroundColor: palette.tint }]}>
              <Pressable accessibilityRole="button" onPress={() => setModalVisible(false)}>
                <FontAwesome5 name={'arrow-left'} size={20} color={'#fff'} />
              </Pressable>
              <Text style={styles.modalTitle}>Modo Grabación</Text>
              <View style={styles.headerSpacer} />
            </View>
            <Text
              style={[
                styles.modalDescription,
                { color: isDarkMode ? '#f3f3f3' : '#4a4a4a' },
              ]}>
              Pulsa el botón para comenzar a grabar tu nota de voz. Mantendremos la energía de la app con colores cálidos.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={[styles.recordButton, recorderState.isRecording ? styles.recordButtonActive : styles.recordButtonIdle]}
              android_ripple={{ color: '#ffffff55', borderless: false }}
              onPress={recorderState.isRecording ? stopRecording : record}>
              <FontAwesome5 name={'microphone'} size={36} color={'#fff'} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.playButton, { backgroundColor: isDarkMode ? 'rgba(187,41,41,0.2)' : '#f8d9d9' }]}
              onPress={() => {
                player.seekTo(0);
                player.play();
              }}>
              <FontAwesome5 name={'play'} size={20} color={palette.tint} />
              <Text style={[styles.playLabel, { color: palette.tint }]}>Escuchar última nota</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Pressable onPress={() => setModalVisible(true)}>
        <FontAwesome5 name={'microphone'} size={40} color={'#a19f9fff'} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 100,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 24,
  },
  modalView: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerSpacer: {
    width: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalDescription: {
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
    color: '#4a4a4a',
    lineHeight: 20,
    fontSize: 14,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  recordButtonIdle: {
    backgroundColor: '#bb2929',
    shadowColor: '#bb2929',
  },
  recordButtonActive: {
    backgroundColor: '#8f1010',
    shadowColor: '#8f1010',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#f8d9d9',
    marginTop: 4,
  },
  playLabel: {
    marginLeft: 10,
    fontWeight: '600',
    fontSize: 14,
  },
});
