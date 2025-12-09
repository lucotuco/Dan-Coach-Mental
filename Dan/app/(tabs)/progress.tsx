import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import { useAuth } from '@/components/AuthContext';
import { getStoredToken, isUnauthorizedStatus, redirectToLogin } from '@/components/AuthContext';

type ChartItem = {
  label: string;
  value: number;
  color: string;
};

const BASE_CHART: ChartItem[] = [
  { label: 'Energía', value: 0, color: '#1d1564' },
  { label: 'Motivacion', value: 0, color: '#c00a0a' },
  { label: 'Estado emocional', value: 0, color: '#16800c' },
  { label: 'Sueño', value: 0, color: '#31a9c7' },
  { label: 'Dolor o molestia', value: 0, color: '#fda531' },
];

const MAX_VALUE = 10;

export default function ProgressScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [chartData, setChartData] = useState<ChartItem[]>(BASE_CHART);
  const [isLoading, setIsLoading] = useState(false);
  const userId = user?._id;
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#0b0f1c' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const textColor = useThemeColor({ light: '#021456', dark: '#cdd5ff' }, 'text');

  useEffect(() => {
    const fetchDailyAverages = async () => {
      if (!API_URL || !userId) {
        return;
      }

      setIsLoading(true);
      try {
        const token = getStoredToken();

        if (!token) {
          redirectToLogin(router, logout);
          return;
        }

        const response = await fetch(
          `${API_URL}/api/chequeos?owner=${encodeURIComponent(userId)}&tipo=${encodeURIComponent(
            'chequeo diario',
          )}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (isUnauthorizedStatus(response.status)) {
          redirectToLogin(router, logout);
          return;
        }
        if (!response.ok) {
          throw new Error('No se pudo obtener el progreso desde los chequeos diarios');
        }

        const data: { variable1?: number; variable2?: number; variable3?: number; variable4?: number; variable5?: number }[] =
          await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          setChartData(BASE_CHART);
          return;
        }

        const totals = data.reduce(
          (acc, current) => {
            acc[0] += current.variable1 ?? 0;
            acc[1] += current.variable2 ?? 0;
            acc[2] += current.variable3 ?? 0;
            acc[3] += current.variable4 ?? 0;
            acc[4] += current.variable5 ?? 0;
            return acc;
          },
          [0, 0, 0, 0, 0],
        );

        const divisor = data.length || 1;
        const averages: ChartItem[] = BASE_CHART.map((item, index) => ({
          ...item,
          value: Math.min(MAX_VALUE, Math.round((totals[index] / divisor) * 10) / 10),
        }));

        setChartData(averages);
      } catch (error) {
        console.error('Error al obtener chequeos diarios para progreso', error);
        setChartData(BASE_CHART);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyAverages();
  }, [API_URL, logout, router, userId]);

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <MedioLogo />
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
                <Text style={[styles.barLabel, { color: '#4a5771' }]}>
                  {item.label}
                  {isLoading ? ' ...' : ''}
                </Text>
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
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    minHeight:32,
  },
});