import GuidedAudioSession from '@/components/SesionGuiada';
import { useRouter } from 'expo-router';

const renovarEnergiaScript = [
'Hola…',
'este es un momento solo para vos.',
'No tenés que hacer nada más que estar acá.',
'Buscá una posición cómoda.',
'Puede ser sentado, apoyando bien los pies en el piso…',
'o acostado, si lo necesitás.',
'Cerrá suavemente los ojos.',
'Y llevá tu atención a la respiración.',
'Inhalá profundo por la nariz…',
'y exhalá lento por la boca.',
'Otra vez…',
'inhalá…',
'exhalá…',
'Con cada exhalación, soltá tensiones.',
'El cuerpo empieza a aflojar.',
'La mente baja un cambio.',
'Ahora vamos a respirar de una manera especial.',
'Inhalá contando 4…',
'sostené 2…',
'exhalá contando 6…',
'Muy bien.',
'Dejá que el aire entre como si fuera energía nueva.',
'Y que salga llevándose el cansancio.',
'Repetí este ritmo a tu propio tiempo.',
'Ahora imaginá algo simple.',
'Visualizá una luz…',
'puede ser del color que vos quieras.',
'Esa luz representa tu energía.',
'Con cada inhalación, esa luz entra por tu pecho.',
'Y empieza a expandirse.',
'Primero llena el torso…',
'los hombros…',
'los brazos…',
'las manos…',
'Seguís respirando…',
'y la luz baja por el abdomen…',
'las piernas…',
'hasta los pies.',
'Todo tu cuerpo se va llenando de energía.',
'No es apuro.',
'Es presencia.',
'Ahora llevá esa luz a tu cabeza.',
'Sentí cómo se aclara la mente.',
'Menos ruido.',
'Más foco.',
'La energía no es nerviosismo.',
'La energía es claridad.',
'Decite internamente:',
'Estoy presente.',
'Estoy enfocado.',
'Mi energía está disponible.',
'Esa energía también llega a tus emociones.',
'Sentí estabilidad.',
'Confianza tranquila.',
'Disponibilidad para lo que venga.',
'No necesitás estar al cien todo el tiempo.',
'Solo necesitás estar conectado.',
'Tomá una última inhalación profunda…',
'y exhalá lento.',
'Mové suavemente manos y pies.',
'Y cuando quieras, abrí los ojos.',
'Llevate esta energía con vos.',
'Está ahí.',
'Siempre podés volver a cargarla.',
];

export default function LibraryScreenVitalidad() {
  const router = useRouter();

  return (
    <GuidedAudioSession
      title="Una meditación para recuperar energía física y mental, y soltar el cansancio"
      scriptTitle="Cargar energia"
      scriptParagraphs={renovarEnergiaScript}
      audioModule={require('@/assets/audios/verse_gpt-4o-mini-tts_0-9x_2025-12-29T20_26_51-076Z.mp3')}
      onBack={() => router.push('/(tabs)/entrenamientosPersonales')}
    />
  );
}