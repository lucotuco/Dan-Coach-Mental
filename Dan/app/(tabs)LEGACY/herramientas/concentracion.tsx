import GuidedAudioSession from '@/components/SesionGuiada';
import { useRouter } from 'expo-router';

const renovarEnergiaScript = [
'Hola…',
'este es un momento para entrenar algo clave:',
'tu atención.',
'Buscá una posición cómoda.',
'Sentí el cuerpo estable.',
'Y cerrá suavemente los ojos.',
'Inhalá profundo por la nariz…',
'exhalá lento por la boca.',
'Otra vez.',
'La concentración empieza cuando el cuerpo se aquieta.',
'Llevá toda tu atención al aire que entra…',
'y al aire que sale.',
'No lo cambies.',
'Solo observá.',
'Cuando la mente se vaya —porque se va a ir—',
'no te enojes.',
'Volvé.',
'Respiración…',
'presente.',
'Cada regreso es un entrenamiento.',
'Ahora imaginá un punto frente a vos.',
'Puede ser una luz, un círculo, una pelota.',
'Ese punto es tu foco.',
'No necesitás pensar en nada más.',
'Solo ese punto.',
'Si aparece un pensamiento…',
'lo dejás pasar',
'y volvés al punto.',
'Sin juicio.',
'Sin pelea.',
'Escuchá los sonidos alrededor.',
'No los rechaces.',
'Dejá que estén…',
'pero no los sigas.',
'Vos elegís dónde va tu atención.',
'Pensamientos…',
'emociones…',
'distracciones…',
'Todo puede estar.',
'Pero no todo necesita tu energía.',
'Ahora llevá ese foco a una acción simple de tu deporte.',
'Un golpe.',
'Un pase.',
'Un movimiento.',
'No el resultado.',
'Solo la acción.',
'Presente.',
'Simple.',
'Clara.',
'Repetí internamente:',
'Acá y ahora.',
'Una cosa a la vez.',
'Tomá una última inhalación profunda…',
'y exhalá lento.',
'Sentí el cuerpo.',
'El eje.',
'La calma activa.',
'Cuando quieras, abrí los ojos.',
'El foco no es algo que tenés.',
'Es algo que practicás.',
];

export default function LibraryScreenVitalidad() {
  const router = useRouter();

  return (
    <GuidedAudioSession
      title="Una meditación para entrenar la atención y reducir distracciones"
      scriptTitle="Concentracion"
      scriptParagraphs={renovarEnergiaScript}
      audioModule={require('@/assets/audios/verse_gpt-4o-mini-tts_0-9x_2025-12-29T20_21_02-648Z.mp3')}
      onBack={() => router.push('/(tabs)/entrenamientosPersonales')}
    />
  );
}