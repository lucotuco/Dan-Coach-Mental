import { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Modal, Pressable, Text} from 'react-native';
import {useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState, createAudioPlayer} from 'expo-audio';
import {TabBarIcon} from '../app/(tabs)/_layout';
import { FontAwesome5 } from '@expo/vector-icons';

export default function RecordingButton() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [modalVisible, setModalVisible] = useState(false);
  const record = async () => {
     setAudioModeAsync({playsInSilentMode: true,allowsRecording: true });
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };
  const stopRecording = async () => {
    // The recording will be available on `audioRecorder.uri`.
    await audioRecorder.stop();
    setAudioModeAsync({allowsRecording: false, playsInSilentMode: true})
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

  return (
    <View style={styles.container}>
      <Modal animationType="slide" transparent={true} visible={modalVisible} //allowSwipeDismissal ={true} presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalVisible(!modalVisible);}}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Pressable
                accessibilityRole="button"
                style={[styles.recordButton, recorderState.isRecording ? styles.recordButtonActive : styles.recordButtonIdle]}
                android_ripple={{ color: '#ffffff55', borderless: false }}
                onPress={recorderState.isRecording ? stopRecording : record}>

                  <FontAwesome5 name={'microphone'} size={36} color={'#fff'} />
                </Pressable>
                <Pressable accessibilityRole="button"
                onPress={() => {
                    player.seekTo(0);
                    player.play();}}>
                  <FontAwesome5 name={'play'} size={30} color={'#ccc'} />
                    </Pressable>

                <Pressable
                  onPress={() => setModalVisible(!modalVisible)}>
                  <Text>Hide Modal</Text>
                </Pressable>
              </View>
            </View>
      </Modal>
      <Pressable
          onPress={() => setModalVisible(true)}>
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
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  recordButtonIdle: {
    backgroundColor: '#1e88e5',
    shadowColor: '#1e88e5',
  },
  recordButtonActive: {
    backgroundColor: '#d32f2f',
    shadowColor: '#d32f2f',
  },
});
