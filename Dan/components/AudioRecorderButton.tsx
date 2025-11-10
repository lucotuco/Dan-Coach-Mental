import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import { Text, View } from './Themed';

type AudioRecorderButtonProps = {
  /**
   * Optional callback invoked when the recording is successfully saved.
   * Receives the URI of the generated audio file.
   */
  onRecordingFinished?: (uri: string) => void;
};

const INITIAL_STATUS_MESSAGE = 'Presiona el micrófono para comenzar a grabar.';

export default function AudioRecorderButton({ onRecordingFinished }: AudioRecorderButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(INITIAL_STATUS_MESSAGE);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingInstance, setRecordingInstance] = useState<Audio.Recording | null>(null);

  const requestPermissionsAsync = useCallback(async () => {
    const existingPermission = await Audio.getPermissionsAsync();

    if (existingPermission.granted) {
      return true;
    }

    const permission = await Audio.requestPermissionsAsync();
    return permission.granted;
  }, []);

  const startRecordingAsync = useCallback(async () => {
    setIsProcessing(true);

    try {
      const hasPermission = await requestPermissionsAsync();

      if (!hasPermission) {
        setStatusMessage('Permiso de micrófono denegado.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecordingInstance(recording);
      setRecordedUri(null);
      setIsRecording(true);
      setStatusMessage('Grabando...');
    } catch (error) {
      console.error('Error al iniciar la grabación', error);
      setStatusMessage('No se pudo iniciar la grabación.');
    } finally {
      setIsProcessing(false);
    }
  }, [requestPermissionsAsync]);

  const stopRecordingAsync = useCallback(async () => {
    if (!recordingInstance) {
      return;
    }

    setIsProcessing(true);

    try {
      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();

      if (uri) {
        setRecordedUri(uri);
        setStatusMessage('Grabación guardada.');
        onRecordingFinished?.(uri);
      } else {
        setStatusMessage('No se pudo acceder al archivo de audio.');
      }
    } catch (error) {
      console.error('Error al detener la grabación', error);
      setStatusMessage('No se pudo guardar la grabación.');
    } finally {
      setRecordingInstance(null);
      setIsRecording(false);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error('Error al restablecer el modo de audio', error);
      }
      setIsProcessing(false);
    }
  }, [onRecordingFinished, recordingInstance]);

  const handlePress = useCallback(() => {
    if (isProcessing) {
      return;
    }

    if (isRecording) {
      void stopRecordingAsync();
    } else {
      void startRecordingAsync();
    }
  }, [isProcessing, isRecording, startRecordingAsync, stopRecordingAsync]);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Detener grabación de audio' : 'Iniciar grabación de audio'}
        onPress={handlePress}
        disabled={isProcessing}
        style={({ pressed }) => [
          styles.button,
          isRecording ? styles.buttonRecording : styles.buttonIdle,
          pressed && !isProcessing ? styles.buttonPressed : null,
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#ffffff" />
        )}
      </Pressable>

      <Text style={styles.statusText}>{statusMessage}</Text>
      {recordedUri ? (
        <Text style={styles.filePath} numberOfLines={1} ellipsizeMode="middle">
          Archivo: {recordedUri}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonIdle: {
    backgroundColor: '#1d1564',
  },
  buttonRecording: {
    backgroundColor: '#d7263d',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  filePath: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});
