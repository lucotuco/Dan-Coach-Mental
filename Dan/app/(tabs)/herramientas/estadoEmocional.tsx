import GuidedAudioSession from '@/components/SesionGuiada';
import { useRouter } from 'expo-router';

const renovarEnergiaScript = [
  'Bienvenido a esta breve sesión para renovar tu energía. Buscá una posición cómoda… relajá los hombros… y cerrá los ojos suavemente.',
  'Inhalá profundo por la nariz… 1, 2, 3, 4… sostené 1, 2… exhalá lento 1, 2, 3, 4. Repetí dos veces más.',
  'Ahora llevá tu atención al centro del pecho. Imaginá una luz tibia, suave, que comienza a encenderse… como una chispa interna que vuelve a tomar fuerza.',
  'Ya activaste tu energía. Estás listo para continuar tu día con más calma y ligereza. Cada inhalación alimenta esa chispa. Cada exhalación libera cansancio, tensión y pensamientos que te drenan.',
  'Decite internamente: “Mi energía vuelve a mí. Me recargo. Me renuevo.”',
  'Sentí cómo esa luz crece y se expande por tu cuerpo. Piernas, brazos, cuello… todo vuelve a activarse con armonía.',
  'Respirá profundo una vez más. Y cuando estés listo… abrí los ojos. Tu energía está volviendo.',
];

export default function LibraryScreenEstadoEmocional() {
  const router = useRouter();

  return (
    <GuidedAudioSession
      title="Movilidad suave para recargar energía"
      scriptTitle="Respirá hondo..."
      scriptParagraphs={renovarEnergiaScript}
      audioModule={require('@/assets/audios/ttsmaker-file-2025-11-18-0-6-21.mp3')}
      
      onBack={() => router.push('/(tabs)/library')}
    />
  );
}