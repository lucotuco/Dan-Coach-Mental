import Constants from 'expo-constants';

type GlobalProcess = { env?: Record<string, string | undefined> };

const globalProcess =
  typeof globalThis !== 'undefined' && 'process' in globalThis
    ? (globalThis.process as GlobalProcess | undefined)
    : undefined;

const EXPO_PUBLIC_API_URL = globalProcess?.env?.EXPO_PUBLIC_API_URL;

const configApiUrl =
  Constants.expoConfig?.extra?.apiUrl || Constants.manifest2?.extra?.apiUrl || EXPO_PUBLIC_API_URL;

export const API_BASE_URL =
  typeof configApiUrl === 'string' && configApiUrl.length > 0 ? configApiUrl.replace(/\/$/, '') : 'http://localhost:3000';
