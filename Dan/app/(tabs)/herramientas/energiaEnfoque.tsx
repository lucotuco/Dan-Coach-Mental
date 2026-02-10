import GuidedAudioSession from '@/components/SesionGuiada';
import { useRouter } from 'expo-router';

const renovarEnergiaScript = [
'Hola…',
'este es un momento para activar tu energía',
'sin perder el eje.',
'Buscá una posición cómoda pero despierta.',
'Columna erguida.',
'Cuerpo presente.',
'Cerrá suavemente los ojos.',
'Inhalá profundo por la nariz…',
'exhalá por la boca.',
'Otra vez.',
'Sentí cómo el cuerpo se enciende.',
'Ahora vamos a cambiar el ritmo.',
'Inhalá fuerte y claro por la nariz…',
'exhalá lento por la boca.',
'La inhalación activa.',
'La exhalación ordena.',
'Repetí este ritmo.',
'Energía arriba.',
'Mente clara.',
'Imaginá una corriente de energía que sube desde los pies.',
'Pies firmes.',
'Piernas activas.',
'Centro fuerte.',
'La energía sube por el torso…',
'llega al pecho…',
'y se distribuye de manera pareja.',
'No hay exceso.',
'No hay bloqueo.',
'Energía disponible.',
'Ahora llevá esa energía a un solo lugar:',
'tu atención.',
'Elegí una palabra que represente tu foco.',
'Puede ser: presente, simple, ahora, confianza.',
'Con cada inhalación, esa palabra se afirma.',
'Con cada exhalación, se limpia el ruido.',
'Una cosa a la vez.',
'Un estímulo.',
'Una decisión.',
'Repetí internamente:',
'Tengo energía.',
'Sé dónde ponerla.',
'Estoy listo.',
'Sentí cómo el cuerpo responde.',
'Postura firme.',
'Respiración estable.',
'Mente alineada.',
'Tomá una última inhalación profunda…',
'y exhalá lento.',
'Mové manos y pies.',
'Abrí los ojos cuando quieras.',
'Salís con energía.',
'Salís con enfoque.',
'Salís con intención.',

];

export default function LibraryScreenVitalidad() {
  const router = useRouter();

  return (
    <GuidedAudioSession
      title="Activá tu energía mental y física"
      scriptTitle="Energía y enfoque"
      scriptParagraphs={renovarEnergiaScript}
      audioModule={require('@/assets/audios/verse_gpt-4o-mini-tts_0-9x_2025-12-29T20_16_46-397Z.mp3')}
      onBack={() => router.push('/(tabs)/entrenamientosPersonales')}
    />
  );
}