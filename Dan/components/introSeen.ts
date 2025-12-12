import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'dan_intro_seen_v1';

export async function getIntroSeen(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(KEY) === '1';
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setIntroSeen(seen: boolean): Promise<void> {
  try {
    const v = seen ? '1' : '0';
    if (Platform.OS === 'web') localStorage.setItem(KEY, v);
    else await AsyncStorage.setItem(KEY, v);
  } catch {
    // no-op
  }
}
