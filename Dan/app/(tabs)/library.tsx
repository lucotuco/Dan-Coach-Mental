import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useRouter} from 'expo-router';
import { Text } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

type IconName = ComponentProps<typeof Ionicons>['name'];

const meditationCategories = [
  {
    id: 'energy-boost',
    title: 'Carga de energía',
    description: 'Recarga tu cuerpo y mente.',
    icon: 'flash-outline' as IconName,
    backgroundColor: '#FFF3E0',
    accentColor: '#F5A524',
    link:'/herramientas/energia'
  },
  {
    id: 'motivation',
    title: 'Motivación',
    description: 'Activa la intención y el foco.',
    icon: 'ribbon-outline' as IconName,
    backgroundColor: '#FFF7E7',
    accentColor: '#E68A00',
    link:'motivacion'
  },
  {
    id: 'concentration',
    title: 'Concentración',
    description: 'Respira y vuelve al presente.',
    icon: 'eye-outline' as IconName,
    backgroundColor: '#EEF7F6',
    accentColor: '#4EA3A1',
    link:'estado-emocional'
  },
  {
    id: 'focus',
    title: 'Energía y enfoque',
    description: 'Integra cuerpo, mente y respiración.',
    icon: 'pulse-outline' as IconName,
    backgroundColor: '#F2FBFC',
    accentColor: '#0092A5',
    link:'sueno'
  },
] as const;

type MeditationCategory = (typeof meditationCategories)[number];

export default function LibraryScreen() {
  const router = useRouter();
  const onCategoryPress = (category: MeditationCategory) => {
    router.push(category.link);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <MedioLogo/>
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>Biblioteca de meditaciones</Text>
        
      </View>
      <Text style={styles.description}>
        Explora sesiones diseñadas para cada momento de tu entrenamiento mental. Selecciona una
        categoría para comenzar.
      </Text>

      <View style={styles.cardStack}>
        {meditationCategories.map((category) => (
          
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir categoría ${category.title}`}
            onPress={() => onCategoryPress(category)}
            style={[styles.card, { backgroundColor: category.backgroundColor }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: category.accentColor }]}>
              <Ionicons name={category.icon} size={24} color="#fff" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{category.title}</Text>
              <Text style={styles.cardSubtitle}>{category.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#1F2A37" />
          </Pressable>
          
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  brandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#D85814',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  brandTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2A37',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  headingBlock: {
    marginTop:20,
    marginBottom: 20,
    alignContent:'center'
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2A37',
  },
  headingHighlight: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1F2A37',
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 24,
  },
  cardStack: {
    rowGap: 16,
  },
  card: {
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#374151',
  },
});