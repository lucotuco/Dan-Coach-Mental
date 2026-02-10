import GuidedAudioSession from '@/components/SesionGuiada';
import { useRouter } from 'expo-router';

const renovarEnergiaScript = [
'Hola…',
'tomá este momento solo para vos.',
'No para exigirte.',
'Para recordar por qué hacés lo que hacés.',
'Buscá una posición cómoda.',
'Sentí el apoyo del cuerpo.',
'Y cerrá suavemente los ojos.',
'Respirá profundo…',
'inhalá por la nariz…',
'exhalá lento por la boca.',
'Otra vez.',
'Y con cada exhalación, dejá afuera las obligaciones,',
'las presiones,',
'el “tengo que”.',
'Llevá la atención al pecho.',
'Ahí donde sentís la respiración.',
'La motivación no está en el futuro.',
'Está acá.',
'En este momento.',
'Respirá…',
'y quedate unos segundos sintiendo tu cuerpo vivo.',
'Ahora imaginá una pequeña llama en el centro de tu pecho.',
'No es grande.',
'No necesita serlo.',
'Es tu deseo.',
'Tus ganas.',
'Tu elección de estar acá.',
'Con cada inhalación, esa llama se aviva un poco más.',
'Con cada exhalación, se vuelve más estable.',
'No quema.',
'No apura.',
'Sostiene.',
'Ahora traé a tu mente una razón por la cual entrenás, competís o jugás.',
'No tiene que ser perfecta.',
'Solo tiene que ser verdadera.',
'Tal vez es crecer.',
'Disfrutar.',
'Superarte.',
'Compartir.',
'Sentirte vivo.',
'Dejá que esa razón se conecte con la llama.',
'Y sentí cómo la motivación se vuelve clara.',
'Repetí internamente, a tu ritmo:',
'Elijo estar acá.',
'Confío en mi proceso.',
'Hago esto porque quiero.',
'Sentí cómo el cuerpo responde.',
'La energía cambia.',
'La postura cambia.',
'Tomá una respiración profunda más…',
'y exhalá lento.',
'Mové manos y pies.',
'Y cuando quieras, abrí los ojos.',
'No salís con obligación.',
'Salís con intención.',
'La motivación no se persigue.',
'Se recuerda.',

];

export default function LibraryScreenEstadoEmocional() {
  const router = useRouter();

  return (
    <GuidedAudioSession
      title="Una meditación para reconectar con tus ganas, tu propósito"
      scriptTitle="Activar la Motivación"
      scriptParagraphs={renovarEnergiaScript}
      audioModule={require('@/assets/audios/verse_gpt-4o-mini-tts_1x_2025-12-26T17_33_10-140Z.mp3')}
      onBack={() => router.push('/(tabs)/entrenamientosPersonales')}
    />
  );
}