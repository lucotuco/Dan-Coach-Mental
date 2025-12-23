import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View as RNView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';
import { useAuth } from '@/components/AuthContext';
import { getStoredToken, isUnauthorizedStatus, redirectToLogin } from '@/components/AuthContext';

type ChartItem = {
  label: string;
  value: number; // 0..100
  color: string;
};

type ChequeoItem = {
  fecha: string; // Date ISO string
  tipo?: string;
  variable1?: number;
  variable2?: number;
  variable3?: number;
  variable4?: number;
  variable5?: number;
  variable6?: number;
  variable7?: number;
};

const BASE_CHART: ChartItem[] = [
  { label: 'Energía', value: 0, color: '#1d1564' },
  { label: 'Motivación', value: 0, color: '#c00a0a' },
  { label: 'Estado emocional', value: 0, color: '#16800c' },
  { label: 'Sueño', value: 0, color: '#31a9c7' },
  { label: 'Dolor o molestia', value: 0, color: '#fda531' },
];

const MAX_VALUE = 100;
const Y_TICKS = [100, 80, 60, 40, 20, 0];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Semana comienza lunes
function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 domingo ... 6 sábado
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function endOfWeekMonday(date: Date) {
  const d = addDays(startOfWeekMonday(date), 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function formatRangeShort(start: Date, end: Date) {
  const sDay = start.getDate();
  const sMon = MONTHS_ES[start.getMonth()];
  const eDay = end.getDate();
  const eMon = MONTHS_ES[end.getMonth()];
  if (start.getMonth() !== end.getMonth()) return `${sDay} ${sMon} – ${eDay} ${eMon}`;
  return `${sDay} – ${eDay} ${eMon}`;
}

function parseChequeoDate(item: ChequeoItem): Date | null {
  if (!item.fecha) return null;
  const d = new Date(item.fecha);
  return isNaN(d.getTime()) ? null : d;
}

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_VALUE, n));
}

/**
 * Normaliza promedios a escala 0..100:
 * - 0..1 -> x100
 * - 0..10 -> x10
 * - 0..100 -> se deja
 */
function normalizeTo100(avg: number) {
  if (avg <= 1.2) return avg * 100;
  if (avg <= 10.5) return avg * 10;
  return avg;
}

function computeAverages(items: ChequeoItem[]) {
  if (!items.length) return { averages: [0, 0, 0, 0, 0] as const, count: 0 };

  const totals = items.reduce(
    (acc, curr) => {
      acc[0] += curr.variable1 ?? 0;
      acc[1] += curr.variable2 ?? 0;
      acc[2] += curr.variable3 ?? 0;
      acc[3] += curr.variable4 ?? 0;
      acc[4] += curr.variable5 ?? 0;
      return acc;
    },
    [0, 0, 0, 0, 0],
  );

  const divisor = items.length || 1;
  const avgs = totals.map((t) => t / divisor);
  const scaled = avgs.map((v) => normalizeTo100(v));
  const rounded = scaled.map((v) => clampPercent(Math.round(v * 10) / 10));

  return { averages: rounded as [number, number, number, number, number], count: items.length };
}

/**
 * Devuelve 1 o 2 líneas para el label, evitando:
 * - corte por letra
 * - ellipsis
 * Mantiene la estructura: nombre arriba, % abajo, delta abajo.
 */
function labelLines(label: string): [string, string?] {
  const lower = label.toLowerCase();

  if (lower === 'motivación') return ['Motiva', 'ción'];
  if (lower === 'estado emocional') return ['Estado', 'emocional'];
  if (lower === 'dolor o molestia') return ['Dolor o', 'molestia'];

  // Si tiene espacio: 1ra palabra arriba, resto abajo
  if (label.includes(' ')) {
    const parts = label.split(' ');
    return [parts[0], parts.slice(1).join(' ')];
  }

  // Si es 1 sola palabra muy larga, la partimos en 2 para que entre
  if (label.length >= 10) {
    const cut = Math.ceil(label.length * 0.6);
    return [label.slice(0, cut), label.slice(cut)];
  }

  return [label];
}

export default function ProgressScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  const [chartData, setChartData] = useState<ChartItem[]>(BASE_CHART);
  const [prevChartData, setPrevChartData] = useState<ChartItem[]>(BASE_CHART);

  const [isLoading, setIsLoading] = useState(false);
  const [samplesCount, setSamplesCount] = useState(0);
  const [prevSamplesCount, setPrevSamplesCount] = useState(0);

  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const userId = user?._id;

  const backgroundColor = useThemeColor({ light: '#fff', dark: '#0b0f1c' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#111827' }, 'background');
  const textColor = useThemeColor({ light: '#021456', dark: '#cdd5ff' }, 'text');
  const mutedText = useThemeColor({ light: '#4a5771', dark: '#9aa6c2' }, 'text');

  const [anchorDate] = useState(() => new Date()); // estable durante la vida de la pantalla

  const { currentStart, currentEnd, prevStart, prevEnd } = useMemo(() => {
  const currentStart = startOfWeekMonday(anchorDate);
  const currentEnd = endOfWeekMonday(anchorDate);

  const prevStart = addDays(currentStart, -7);
  const prevEnd = addDays(currentStart, -1);
  prevEnd.setHours(23, 59, 59, 999);

  return { currentStart, currentEnd, prevStart, prevEnd };
}, [anchorDate]);

  const currentRangeLabel = useMemo(() => formatRangeShort(currentStart, currentEnd), [currentStart, currentEnd]);
  const prevRangeLabel = useMemo(() => formatRangeShort(prevStart, prevEnd), [prevStart, prevEnd]);

  useEffect(() => {
    const fetchChecks = async () => {
      if (!API_URL || !userId) return;

      setIsLoading(true);
      try {
        const token = getStoredToken();
        if (!token) {
          redirectToLogin(router, logout);
          return;
        }

        const response = await fetch(
          `${API_URL}/api/chequeos?owner=${encodeURIComponent(userId)}&tipo=${encodeURIComponent('chequeo diario')}`,
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
        if (!response.ok) throw new Error('No se pudo obtener el progreso desde los chequeos diarios');

        const data: ChequeoItem[] = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          setSamplesCount(0);
          setPrevSamplesCount(0);
          setChartData(BASE_CHART);
          setPrevChartData(BASE_CHART);
          return;
        }

        const withDate = data
          .map((item) => ({ item, d: parseChequeoDate(item) }))
          .filter((x) => x.d !== null) as { item: ChequeoItem; d: Date }[];

        const currentWeekItems = withDate
          .filter(({ d }) => d >= currentStart && d <= currentEnd)
          .map(({ item }) => item);

        const prevWeekItems = withDate
          .filter(({ d }) => d >= prevStart && d <= prevEnd)
          .map(({ item }) => item);

        const cur = computeAverages(currentWeekItems);
        const prev = computeAverages(prevWeekItems);

        setSamplesCount(cur.count);
        setPrevSamplesCount(prev.count);

        setChartData(BASE_CHART.map((it, idx) => ({ ...it, value: cur.averages[idx] })));
        setPrevChartData(BASE_CHART.map((it, idx) => ({ ...it, value: prev.averages[idx] })));
      } catch (e) {
        console.error('Error al obtener chequeos diarios para progreso', e);
        setSamplesCount(0);
        setPrevSamplesCount(0);
        setChartData(BASE_CHART);
        setPrevChartData(BASE_CHART);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecks();
  }, [API_URL, logout, router, userId, anchorDate]);

  const hasData = samplesCount > 0;

  const deltaByLabel = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of chartData) {
      const prev = prevChartData.find((p) => p.label === item.label)?.value ?? 0;
      map.set(item.label, Math.round((item.value - prev) * 10) / 10);
    }
    return map;
  }, [chartData, prevChartData]);

  const overallAvg = useMemo(() => {
    const values = chartData.map((c) => c.value);
    const sum = values.reduce((a, b) => a + b, 0);
    return values.length ? Math.round((sum / values.length) * 10) / 10 : 0;
  }, [chartData]);

  const selected = useMemo(() => {
    if (!selectedLabel) return null;
    const current = chartData.find((c) => c.label === selectedLabel);
    if (!current) return null;

    const prev = prevChartData.find((p) => p.label === selectedLabel);
    const delta = deltaByLabel.get(selectedLabel) ?? 0;

    let band = 'Medio';
    if (current.value >= 70) band = 'Alto';
    else if (current.value <= 35) band = 'Bajo';

    return {
      ...current,
      prevValue: prev?.value ?? 0,
      delta,
      band,
    };
  }, [chartData, deltaByLabel, prevChartData, selectedLabel]);

  const insights = useMemo(() => {
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    return {
      best: { ...best, delta: deltaByLabel.get(best.label) ?? 0 },
      worst: { ...worst, delta: deltaByLabel.get(worst.label) ?? 0 },
    };
  }, [chartData, deltaByLabel]);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor }]}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <MedioLogo />

      <Text style={[styles.heading, { color: textColor }]}>EVOLUCIÓN DE TU</Text>
      <Text style={[styles.heading, { color: textColor }]}>PROGRESO MENTAL</Text>

      <Text style={[styles.subheading, { color: mutedText }]}>
        Semana actual: {currentRangeLabel} · vs anterior: {prevRangeLabel}
      </Text>

      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.cardTitle, { color: textColor }]}>Semana actual</Text>
            <Text style={[styles.cardMeta, { color: mutedText }]}>
              {isLoading ? 'Calculando…' : `${samplesCount} chequeos`} · Semana anterior: {prevSamplesCount}
            </Text>
          </View>

          <View style={styles.summaryPill}>
            <Feather name="activity" size={14} color={mutedText} />
            <Text style={[styles.summaryText, { color: mutedText }]}>
              {isLoading ? '—' : `${overallAvg}%`}
            </Text>
          </View>
        </View>

        {!hasData && !isLoading ? (
          <View style={styles.emptyState}>
            <Feather name="info" size={18} color={mutedText} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>Todavía no hay datos</Text>
            <Text style={[styles.emptyText, { color: mutedText }]}>
              Completá al menos 1 chequeo diario para ver tu progreso de esta semana.
            </Text>

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/chequeoDiario')}
              activeOpacity={0.85}
            >
              <Feather name="check-circle" size={16} color="#fff" />
              <Text style={styles.ctaText}>Hacer chequeo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {selected && (
              <View style={styles.detailPanel}>
                <View style={styles.detailHeader}>
                  <RNView style={styles.detailHeaderLeft}>
                    <View style={[styles.dot, { backgroundColor: selected.color }]} />
                    <Text style={[styles.detailTitle, { color: textColor }]}>{selected.label}</Text>
                  </RNView>

                  <Pressable onPress={() => setSelectedLabel(null)} hitSlop={10}>
                    <Feather name="x" size={18} color={mutedText} />
                  </Pressable>
                </View>

                <Text style={[styles.detailLine, { color: mutedText }]}>
                  Semana actual:{' '}
                  <Text style={[styles.detailStrong, { color: textColor }]}>{selected.value}%</Text> · Nivel:{' '}
                  <Text style={[styles.detailStrong, { color: textColor }]}>{selected.band}</Text>
                </Text>

                <Text style={[styles.detailLine, { color: mutedText }]}>
                  Semana anterior:{' '}
                  <Text style={[styles.detailStrong, { color: textColor }]}>{selected.prevValue}%</Text> · Cambio:{' '}
                  <Text style={[styles.detailStrong, { color: selected.delta >= 0 ? '#16a34a' : '#dc2626' }]}>
                    {selected.delta >= 0 ? '+' : ''}
                    {selected.delta}%
                  </Text>
                </Text>
              </View>
            )}

            {/* CHART */}
            <View style={styles.chartArea}>
              <View style={styles.yAxis}>
                {Y_TICKS.map((value) => (
                  <View key={value} style={styles.yTick}>
                    <Text style={[styles.yLabel, { color: mutedText }]}>{value}</Text>
                    <Feather name="percent" size={11} color={mutedText} />
                  </View>
                ))}
              </View>

              <View style={styles.barWrapper}>
                {chartData.map((item) => {
                  const delta = deltaByLabel.get(item.label) ?? 0;
                  const isSelected = selectedLabel === item.label;
                  const [l1, l2] = labelLines(item.label);

                  return (
                    <Pressable
                      key={item.label}
                      style={styles.barItem}
                      onPress={() => setSelectedLabel(item.label)}
                    >
                      {/* LABEL ARRIBA (2 líneas sin ellipsis) */}
                      <View style={styles.topLabelBox}>
                        <Text style={[styles.topLabelLine, { color: mutedText }]}>{l1}</Text>
                        <Text style={[styles.topLabelLine, { color: mutedText }]}>{l2 ?? ' '}</Text>
                      </View>

                      <View style={[styles.barBackground, isSelected && styles.barBackgroundSelected]}>
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

                      {/* % + DELTA ABAJO */}
                      <View style={styles.bottomInfo}>
                        <Text style={[styles.bottomValue, { color: mutedText }]}>
                          {`${item.value}%`}

                        </Text>

                        {prevSamplesCount > 0 && !isLoading ? (
                          <View style={styles.bottomDeltaRow}>
                            <Feather
                              name={delta >= 0 ? 'arrow-up-right' : 'arrow-down-right'}
                              size={12}
                              color={delta >= 0 ? '#16a34a' : '#dc2626'}
                            />
                            <Text
                              style={[
                                styles.bottomDeltaText,
                                { color: delta >= 0 ? '#16a34a' : '#dc2626' },
                              ]}
                            >
                              {delta >= 0 ? '+' : ''}
                              {delta}%
                            </Text>
                          </View>
                        ) : (
                          <Text style={[styles.bottomDeltaPlaceholder, { color: mutedText }]}>—</Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* INSIGHTS */}
            <View style={styles.insightsBox}>
              <View style={styles.insightRow}>
                <Feather name="star" size={16} color={mutedText} />
                <Text style={[styles.insightText, { color: mutedText }]}>
                  Punto fuerte:{' '}
                  <Text style={[styles.detailStrong, { color: textColor }]}>{insights.best.label}</Text> ({insights.best.value}%)
                  {prevSamplesCount > 0 ? (
                    <Text style={{ color: insights.best.delta >= 0 ? '#16a34a' : '#dc2626' }}>
                      {' '}
                      · {insights.best.delta >= 0 ? '+' : ''}
                      {insights.best.delta}%
                    </Text>
                  ) : null}
                </Text>
              </View>

              <View style={styles.insightRow}>
                <Feather name="trending-up" size={16} color={mutedText} />
                <Text style={[styles.insightText, { color: mutedText }]}>
                  Oportunidad:{' '}
                  <Text style={[styles.detailStrong, { color: textColor }]}>{insights.worst.label}</Text> ({insights.worst.value}%)
                  {prevSamplesCount > 0 ? (
                    <Text style={{ color: insights.worst.delta >= 0 ? '#16a34a' : '#dc2626' }}>
                      {' '}
                      · {insights.worst.delta >= 0 ? '+' : ''}
                      {insights.worst.delta}%
                    </Text>
                  ) : null}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 28 },

  heading: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subheading: {
    marginTop: 6,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },

  card: {
    marginTop: 14,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: { flex: 1, paddingRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardMeta: { marginTop: 4, fontSize: 12, fontWeight: '600' },

  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(120,140,170,0.12)',
  },
  summaryText: { marginLeft: 6, fontSize: 12, fontWeight: '800' },

  detailPanel: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(120,140,170,0.12)',
    marginBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  detailTitle: { fontSize: 14, fontWeight: '900' },
  detailLine: { fontSize: 12, fontWeight: '600', lineHeight: 16, marginBottom: 4 },
  detailStrong: { fontWeight: '900' },
  dot: { width: 10, height: 10, borderRadius: 999, marginRight: 8 },

  // --- CHART LAYOUT (alineación)
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  yAxis: {
    width: 52, // fijo => no “empuja” raro
    height: 220,
    paddingVertical: 6,
    justifyContent: 'space-between',
    marginRight: 8,
  },
  yTick: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  yLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    marginRight: 2,
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
    minWidth: 0,
  },

  topLabelBox: {
    height: 28, // 2 líneas consistentes
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLabelLine: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    textAlign: 'center',
  },

  barBackground: {
    width: 34,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#e8ecf8',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  barBackgroundSelected: { borderColor: 'rgba(2,20,86,0.35)' },
  bar: { width: '100%', borderRadius: 12 },

  bottomInfo: {
    marginTop: 10,
    alignItems: 'center',
    minHeight: 34,
  },
  bottomValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  bottomDeltaRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomDeltaText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '900',
  },
  bottomDeltaPlaceholder: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    opacity: 0.6,
  },

  insightsBox: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(120,140,170,0.10)',
  },
  insightRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  insightText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 16, marginLeft: 10 },

  emptyState: { paddingVertical: 18, alignItems: 'center' },
  emptyTitle: { marginTop: 8, fontSize: 15, fontWeight: '800' },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  ctaButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#021456',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ctaText: { marginLeft: 8, color: '#fff', fontSize: 13, fontWeight: '800' },
});
