+157
-18

import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

const chartData = [
  { label: 'Energía', value: 4, color: '#1d1564' },
  { label: 'Motiva', value: 7, color: '#c00a0a' },
  { label: 'Estado emocional', value: 6, color: '#16800c' },
  { label: 'Sueño', value: 5, color: '#31a9c7' },
  { label: 'Dolor o molestia', value: 4, color: '#fda531' },
];

const MAX_VALUE = 10;

export default function ProgressScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#0b0f1c' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const textColor = useThemeColor({ light: '#021456', dark: '#cdd5ff' }, 'text');
  const accentColor = useThemeColor({ light: '#b25959', dark: '#f27777' }, 'tint');

  return (
    <View style={[styles.screen, { backgroundColor }]}> 
  <MedioLogo/>
      <Text style={[styles.heading, { color: textColor }]}>EVOLUCIÓN DE TU</Text>
      <Text style={[styles.heading, { color: textColor }]}>PROGRESO MENTAL</Text>

      <View style={[styles.card, { backgroundColor: cardColor }]}> 
        <View style={styles.cardHeader}> 
          <Text style={[styles.cardTitle, { color: textColor }]}>Semana actual</Text>
        </View>
        <View style={styles.chartArea}> 
          <View style={styles.yAxis}> 
            {[MAX_VALUE, 8, 6, 4, 2, 0].map((value) => (
              <Text key={value} style={[styles.yLabel, { color: '#4a5771' }]}>
                {value}
              </Text>
            ))}
          </View>
          <View style={styles.barWrapper}> 
            {chartData.map((item) => (
              <View key={item.label} style={styles.barItem}> 
                <View style={styles.barBackground}> 
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: item.color,
                        height: `${(item.value / MAX_VALUE) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: '#4a5771' }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  card: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxis: {
    marginRight: 8,
    justifyContent: 'space-between',
    height: 220,
    paddingVertical: 6,
  },
  yLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  barWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 6,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barBackground: {
    width: 40,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#e8ecf8',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 14,
    minHeight:32,
  },
});