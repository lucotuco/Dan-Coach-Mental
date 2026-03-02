import GuidedAudioSession from '@/components/SesionGuiada';
import { useRouter } from 'expo-router';

const renovarEnergiaScript = [
'Este es un momento para vos.',
'No para corregirte.',
'Para acompañarte.',
'Buscá una posición cómoda.',
'Dejá que el cuerpo se apoye.',
'Cerrá suavemente los ojos.',
'Y llevá la atención a la respiración.',
'Inhalá profundo por la nariz…',
'exhalá lento por la boca.',
'Otra vez.',
'Y con cada exhalación, aflojá un poco más.',
'No hace falta que estés perfecto.',
'Solo presente.',
'Dejá que lo que sentís esté.',
'Sin empujarlo.',
'Sin juzgarlo.',
'Respirá…',
'y quedate acá.',
'Ahora imaginá que dentro tuyo empieza a aparecer una luz cálida.',
'Como un sol suave.',
'Esa luz no apura.',
'Abraza.',
'Con cada inhalación, la luz se expande.',
'Con cada exhalación, afloja la tensión.',
'El pecho se abre.',
'La respiración se hace más libre.',
'Escuchá estas frases…',
'y dejá que resuenen:',
'Estoy haciendo lo mejor que puedo.',
'Aprendo de cada experiencia.',
'Esto también pasa.',
'No es convencer.',
'Es recordar.',
'Ahora pensá en algo pequeño que sí esté funcionando.',
'Un gesto.',
'Una actitud.',
'Un avance.',
'Dejá que eso tenga lugar.',
'La positividad no es negar.',
'Es equilibrar.',
'Tomá una inhalación profunda…',
'y exhalá lento.',
'Mové suavemente el cuerpo.',
'Y cuando quieras, abrí los ojos.',
'Podés seguir.',
'Paso a paso.',
'Con ánimo renovado.',
];

export default function LibraryScreenVitalidad() {
  const router = useRouter();

  return (
    <GuidedAudioSession
      title="Una meditación para acompañarte y levantar el ánimo"
      scriptTitle="Ánimo y positividad"
      scriptParagraphs={renovarEnergiaScript}
      audioModule={require('@/assets/audios/verse_gpt-4o-mini-tts_1x_2025-12-26T22_42_24-449Z.mp3')}
      onBack={() => router.push('/(tabs)/library')}
    />
  );
}