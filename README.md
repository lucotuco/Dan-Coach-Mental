# DAN Coach Mental - Aplicación Multiplataforma 📱💻

Frontend de **DAN**, construido con React Native y Expo. Esta aplicación permite a los deportistas interactuar con su Coach Mental a través de chat de texto y llamadas de voz en tiempo real. Está diseñada para funcionar en Web, Android e iOS, adaptando su interfaz según el rol del usuario (Entrenador o Jugador).

🔗 This project uses a separate API. [Click here to view the Backend code](https://github.com/lucotuco/Dan-Coach-Mental-Backend)

## 🚀 Características Principales
* **Expo Router:** Navegación avanzada basada en archivos, separando las vistas en flujos de `(coachTabs)` y `(memberTabs)` según el tipo de usuario autenticado[cite: 2].
* **Llamadas WebRTC con IA:** Integración con `@openai/agents` y `livekit-client` para sostener llamadas de voz de latencia ultra baja directamente en el navegador (Web) con detección de interrupción de voz[cite: 2].
* **Grabación de Audio Nativo/Web:** Soporte para grabar audios utilizando `expo-audio` y enviar reflexiones o chequeos diarios mediante FormData al backend[cite: 2].
* **Paneles Interactivos:** Seguimiento de progreso, chequeos de los 8 pilares mentales (con sliders interactivos), y visualización de planes de acción generados por la IA[cite: 2].

## 🛠️ Tecnologías Utilizadas
* **Framework:** React Native + Expo (SDK ~54)[cite: 2].
* **Navegación:** `expo-router`[cite: 2].
* **Comunicaciones en Tiempo Real:** `@openai/agents/realtime`, `react-native-webrtc`[cite: 2].
* **Almacenamiento Local:** `@react-native-async-storage/async-storage` (Contexto de Autenticación)[cite: 2].
* **Componentes UI:** `@react-native-community/slider`, `react-native-paper`[cite: 2].

## ⚙️ Instalación y Ejecución Local

1. **Clonar el repositorio y entrar a la carpeta del proyecto:**
   \`\`\`bash
   cd lucotuco-dan-coach-mental/Dan
   \`\`\`

2. **Instalar dependencias:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configurar el entorno:**
   Crea un archivo `.env` en la raíz de la carpeta `Dan` y enlaza el frontend con tu backend local o de producción:
   \`\`\`env
   EXPO_PUBLIC_API_URL=http://localhost:4000
   \`\`\`
   *(Nota: Asegúrate de poner la IP de tu computadora en lugar de `localhost` si vas a probar la aplicación escaneando el código QR con un celular físico en la misma red WiFi)*[cite: 2].

4. **Iniciar el servidor de desarrollo (Expo):**
   \`\`\`bash
   npm run start
   \`\`\`
   Para forzar el entorno web directamente (recomendado para probar las llamadas Realtime):
   \`\`\`bash
   npm run web
   \`\`\`

## 📂 Estructura de la Aplicación
* `/app`: Rutas de la aplicación (Pantalla de Login, Registro, Onboarding de equipos, y las pestañas diferenciadas para Coaches y Miembros)[cite: 2].
* `/components`: Componentes reutilizables como la interfaz del chat (`DanChatWeb`), el módulo de llamadas (`DanVoiceCall`), Contexto de Autenticación (`AuthContext`) y componentes visuales temáticos[cite: 2].
* `/constants`: Archivos de configuración visual (Colores globales) y opciones del stack de navegación[cite: 2].
* `/assets`: Fuentes personalizadas, íconos y videos introductorios[cite: 2].
