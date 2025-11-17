import { Alert, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { ComponentProps } from 'react';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MedioLogo from '@/components/MedioLogo';
import { Text, View } from '@/components/Themed';

type IconName = ComponentProps<typeof Ionicons>['name'];

const energyOptions = [
  {
    id: 'renew',
    title: 'Renovar la energía',
    subtitle: 'Recuperá la calma cuando la energía está baja.',
    icon: 'leaf-outline' as IconName,
    backgroundColor: '#FFEEDB',
    iconBackground: '#F07F24',
    destination: 'renovarEnergia',
  },
  {
    id: 'vitality',
    title: 'Vitalidad en minutos',
    subtitle: 'Activaciones cortas para retomar el foco.',
    icon: 'sunny-outline' as IconName,
    backgroundColor: '#FFF5E8',
    iconBackground: '#F2A341',
  },
  {
    id: 'mood',
    title: 'Ánimo y positividad',
    subtitle: 'Respira, equilibrate y recuperá confianza.',
    icon: 'happy-outline' as IconName,
    backgroundColor: '#FFEFD1',
    iconBackground: '#F6C046',
  },
] as const;

type EnergyOption = (typeof energyOptions)[number];

export default function EnergyScreen() {
  const router = useRouter();

  const handleOptionPress = (option: EnergyOption) => {
    if (option.destination) {
      router.push('/(tabs)/herramientas/'+option.destination);
      return;
    }

    Alert.alert(
      option.title,
      'Muy pronto tendrás más prácticas disponibles para esta categoría.'
    );
  };

  return (
    <>
    <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.push('/(tabs)/library')}
              style={styles.headerBackButton}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={24} color="#031355" />
            </Pressable>
          ),
        }}
      />
    <ScrollView style={[styles.screen, {backgroundColor:'#fff'}]} contentContainerStyle={styles.content}>
      <MedioLogo />
      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroTitle}>Energía</Text>
          <Text style={styles.heroSubtitle}>
            Meditaciones para mejorar energía cuando está baja
          </Text>
        </View>
      </View>

      <View style={styles.optionsList}>
        {energyOptions.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => handleOptionPress(option)}
            accessibilityRole="button"
            accessibilityLabel={option.title}
            style={[styles.optionCard, { backgroundColor: option.backgroundColor }]}
          >
            <View style={[styles.optionIcon, { backgroundColor: option.iconBackground }]}>
              <Ionicons name={option.icon} size={28} color="#fff" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8C5B1A" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF9F2',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2ff',
    marginLeft: 20
  },
  content: {
    padding: 24,
    gap: 24,
  },
  heroCard: {
    borderRadius: 32,
    paddingBottom:32,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#00000015',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heroTextBlock: {
    alignItems: 'center',
    gap: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#C55218',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6F4D2C',
  },
  optionsList: {
    gap: 18,
  },
  optionCard: {
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5A3B1D',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#8B6A45',
  },
});