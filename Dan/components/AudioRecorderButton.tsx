import { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Modal, Pressable, Text} from 'react-native';
import {useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState, createAudioPlayer} from 'expo-audio';
import {TabBarIcon} from '../app/(tabs)/_layout';
import { FontAwesome5 } from '@expo/vector-icons';

export default function RecordingButton() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [modalVisible, setModalVisible] = useState(false);
  const [player, setPlayer] = useState<ReturnType<typeof createAudioPlayer> | null>(null);

  const record = async () => {
    await setAudioModeAsync({playsInSilentMode: true,allowsRecording: true });
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  };
  const stopRecording = async () => {
    // The recording will be available on `audioRecorder.uri`.
    await audioRecorder.stop();
    setAudioModeAsync({allowsRecording: false, playsInSilentMode: true})
  };

  useEffect(() => {
    if (!audioRecorder.uri) {
      setPlayer((current) => {
        current?.stop();
        return null;
      });
      return;
    }

    const nextPlayer = createAudioPlayer(audioRecorder.uri);

    setPlayer((current) => {
      current?.stop();
      return nextPlayer;
    });

    return () => {
      nextPlayer.stop();
    };
  }, [audioRecorder.uri]);

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
                onPress={recorderState.isRecording ? stopRecording : record}>

                  {recorderState.isRecording ? <FontAwesome5 name={'microphone'} size={40} color={'#ff0000ff'} /> : <FontAwesome5 name={'microphone'} size={40} color={'#ccc'} />}
                </Pressable>
                <Pressable accessibilityRole="button"
                onPress={async() => {
                    await player?.stop();
                    player?.seekTo(0);
                    player?.play();}}>
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
});
