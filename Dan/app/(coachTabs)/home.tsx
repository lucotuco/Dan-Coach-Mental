// app/(tabs)/coachHome.tsx  (o donde lo tengas en tu router)
// Ajustá el path según tu estructura: app/(tabs)/homeCoach.tsx, etc.

import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/components/AuthContext";

type CardProps = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  rightLabel?: string;
};

function HomeCard({ title, subtitle, icon, onPress, rightLabel }: CardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={18} color="#111" />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>

      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardCta}>Ver</Text>
        <Ionicons name="chevron-forward" size={18} color="#111" />
      </View>
    </Pressable>
  );
}

export default function CoachHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const firstName = useMemo(() => {
    const raw =
      (user?.name as string) ||
      "";
    const trimmed = String(raw).trim();
    if (!trimmed) return "Coach";
    return trimmed.split(" ")[0];
  }, [user]);


  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {firstName}</Text>
        <Text style={styles.headerSubtitle}>
          Este es el estado del equipo y lo que toca trabajar esta semana.
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.grid}>
        <HomeCard
          title="Pulso semanal"
          subtitle={`8 pilares + comparación vs semana anterior`}
          icon="pulse"
          onPress={() => router.push("/")} // ajustá ruta
        />

        <HomeCard
          title="Prioridades"
          subtitle="Focos sugeridos por DAN para esta semana · Editá objetivo y consigna"
          icon="flag"
          onPress={() => router.push("/")} // ajustá ruta
        />

        <HomeCard
          title="Planes vigentes"
          subtitle="Plan de equipo + planes individuales destacados · Sugerí cambios"
          icon="calendar"
          onPress={() => router.push("/")} // ajustá ruta
        />

        <HomeCard
          title="Equipo"
          subtitle="Miembros, invitaciones, roles y configuración del ciclo semanal"
          icon="people"
          onPress={() => router.push("/(coachTabs)/equipo")} 
        />
      </View>
      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          Tip: la bandeja “Atención” vive dentro de “Equipo” como popup/bottom sheet.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    gap: 6,
    paddingHorizontal: 2,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  grid: {
    gap: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.995 }],
    opacity: 0.96,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    flexShrink: 1,
  },
  cardSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  cardCta: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#111",
  },
  pillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  footerNote: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  footerNoteText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
});