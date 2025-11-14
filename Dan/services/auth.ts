import { API_BASE_URL } from '@/services/config';

const AUTH_TOKEN_KEY = 'authToken';

let inMemoryToken: string | null = null;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: Record<string, unknown>;
  message?: string;
  [key: string]: unknown;
}

const defaultErrorMessage = 'No fue posible iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.';

async function parseResponse(response: Response): Promise<LoginResponse | Record<string, unknown>> {
  try {
    return await response.json();
  } catch (error) {
    return {};
  }
}

export async function login(credentials: LoginPayload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      signal: controller.signal,
    });

    const body = await parseResponse(response);

    if (!response.ok) {
      const errorMessage =
        typeof body === 'object' && body && 'message' in body && typeof body.message === 'string'
          ? body.message
          : defaultErrorMessage;
      throw new Error(errorMessage);
    }

    if (typeof body !== 'object' || !body) {
      throw new Error(defaultErrorMessage);
    }

    const { token } = body as LoginResponse;

    if (!token) {
      throw new Error('La respuesta del servidor no incluye el token de autenticación.');
    }

    inMemoryToken = token;

    return body as LoginResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Verifica tu conexión e intenta nuevamente.');
      }

      if (error.message === 'Network request failed') {
        throw new Error('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
      }

      throw error;
    }

    throw new Error(defaultErrorMessage);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getStoredToken() {
  return inMemoryToken;
}

export async function clearSession() {
  inMemoryToken = null;
}

export { AUTH_TOKEN_KEY };
