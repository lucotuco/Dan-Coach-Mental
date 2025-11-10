import { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Modal, Pressable, Text } from 'react-native';
import {useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState, createAudioPlayer} from 'expo-audio';

export default function RecordingButton() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [modalVisible, setModalVisible] = useState(false);

  const record = async () => {
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };

  const stopRecording = async () => {
    // The recording will be available on `audioRecorder.uri`.
    await audioRecorder.stop();
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
      <Modal animationType="slide" transparent={false} visible={modalVisible} 
        onRequestClose={() => {
          alert('Modal has been closed.');
          setModalVisible(!modalVisible);}}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Button
                  title={recorderState.isRecording ? 'Stop Recording' : 'Start Recording'}
                  onPress={recorderState.isRecording ? stopRecording : record}
                />
                <Button
                  title="Play Sound"
                  onPress={() => {
                    player.seekTo(0);
                    player.play();
                  }}
                />
                <Pressable
                  onPress={() => setModalVisible(!modalVisible)}>
                  <Text>Hide Modal</Text>
                </Pressable>
              </View>
            </View>
      </Modal>
      <Pressable
          onPress={() => setModalVisible(true)}>
          <Text>Show Modal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 10,
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
});
