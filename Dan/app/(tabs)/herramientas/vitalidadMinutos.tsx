import GuidedAudioSession from '@/components/SesionGuiada';
import { useRouter } from 'expo-router';

const renovarEnergiaScript = [
'Cerrá suavemente los ojos.',
'Respirá profundo… inhalá por la nariz… y exhalá lento por la boca.',
'Sentí cómo el cuerpo se afloja con cada exhalación.',
'Dejá que por un momento nada sea más importante que este espacio para vos.',
'',
'Volvé a inhalar… y al exhalar dejá caer los hombros.',
'Sentí el aire fresco entrando y saliendo, marcando un ritmo tranquilo, firme, constante.',
'Cada respiración te centra.',
'Cada respiración te devuelve a vos.',
'',
'Permitite llegar a este momento con apertura, sin juicios.',
'',
'Ahora, llevá tu atención al centro del pecho.',
'Imaginá allí una pequeña chispa de luz… suave… cálida.',
'Esa chispa representa tu ánimo, tu energía interna, tu capacidad de levantarte una y otra vez.',
'',
'Con cada inhalación, esa luz crece.',
'Con cada exhalación, se expande.',
'Sentila avanzar por tus brazos, por tu espalda, por tus piernas.',
'Es tu propia fuerza despertándose.',
'',
'Repetí mentalmente:',
'“Mi energía vuelve.',
'Mi ánimo crece.',
'Estoy presente y listo.”',
'',
'Traé a tu mente un momento deportivo donde te sentiste bien… fuerte… seguro.',
'Puede ser una jugada, un movimiento técnico, una competencia, un entrenamiento.',
'Ese momento donde sabías que estabas en tu eje, conectado, confiado.',
'',
'Volvé a sentirlo.',
'La postura… la respiración… la emoción.',
'Esa sensación sigue siendo tuya.',
'Sigue dentro tuyo, disponible cuando la necesitás.',
'',
'Respirá…',
'Y dejá que ese recuerdo te eleve, como una ola que te impulsa hacia adelante.',
'',
'Ahora, repetí dentro tuyo, con calma y convicción:',
'',
'“Hoy elijo enfocarme en lo bueno.',
'Hoy elijo crecer.',
'Hoy elijo avanzar con ánimo y con luz.”',
'',
'Sentí cómo estas palabras ordenan tu mente, calman tu pecho y aclaran tu mirada.',
'',
'Volvé lentamente a la respiración…',
'Inhalá energía… exhalá tensión.',
'Mové suavemente los dedos de las manos… de los pies…',
'',
'Y cuando estés listo, abrí los ojos.',
'Respirá una vez más y reconocé esto:',
'',
'Tu ánimo está despierto.',
'Tu energía está encendida.',
'Vos podés.',
];

export default function LibraryScreenVitalidad() {
  const router = useRouter();

  return (
    <GuidedAudioSession
      title="Movilidad suave para recargar energía"
      scriptTitle="Respirá hondo..."
      scriptParagraphs={renovarEnergiaScript}
      audioModule={require('@/assets/audios/verse_gpt-4o-mini-tts_1x_2025-12-09T03_09_34-080Z.mp3')}
      onBack={() => router.push('/(tabs)/library')}
    />
  );
}