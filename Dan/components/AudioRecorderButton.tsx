import { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable, Text } from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorderState,
  createAudioPlayer,
} from 'expo-audio';
import { FontAwesome5 } from '@expo/vector-icons';

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

  const modalPrimary = '#0b2a63';
  const modalSecondary = '#123776';
  const modalText = '#d8e4ff';

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
              {
                borderColor: modalSecondary,
                backgroundColor: modalPrimary,
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              style={styles.dismissButton}
              hitSlop={10}
              onPress={() => setModalVisible(false)}>
              <FontAwesome5 name={'arrow-left'} size={16} color={modalText} />
            </Pressable>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: modalText }]}>Grabar</Text>
              <Text style={[styles.modalDescription, { color: modalText }]}>Toca y habla.</Text>
              <Pressable
                accessibilityRole="button"
                style={[
                  styles.recordButton,
                  {
                    backgroundColor: recorderState.isRecording ? '#0f4aa3' : '#1a5ed1',
                    shadowColor: '#0f4aa3',
                  },
                ]}
                android_ripple={{ color: '#ffffff33', borderless: false }}
                onPress={recorderState.isRecording ? stopRecording : record}>
                <FontAwesome5 name={'microphone'} size={18} color={modalText} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.playButton, { borderColor: modalText }]}
                onPress={() => {
                  player.seekTo(0);
                  player.play();
                }}>
                <FontAwesome5 name={'play'} size={12} color={modalText} />
              </Pressable>
            </View>
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
    backgroundColor: 'rgba(4,9,20,0.75)',
    padding: 24,
  },
  modalView: {
    width: 100,
    height: 100,
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  dismissButton: {
    position: 'absolute',
    top: 6,
    left: -6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modalContent: {
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalDescription: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
    marginTop: 6,
  },
});
