// app/memebertabs/home.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useAuth, getStoredToken } from "@/components/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type Role = "coach" | "member";

type Team = {
  teamId: string;
  name: string;
  type: string;
  joinCode: string;
  ownerUserId: string;
};

type TeamMeResponse = { team: Team | null };

type Checkin = {
  _id: string;
  weekStart: string;
  createdAt: string;
  scores?: Record<string, number>;
};

type CurrentCheckinResponse = { item: Checkin | null };

type TeamWeekPlansResponse = { weekStart: string; plans: any[] };

function buildApiUrl(path: string) {
  if (!API_BASE_URL) throw new Error("Falta EXPO_PUBLIC_API_URL en el front");
  const base = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
  return `${base}/api${path}`;
}

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const txt = await res.text();
  const data = txt ? JSON.parse(txt) : null;

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data as T;
}

function Card({
  title,
  subtitle,
  icon,
  onPress,
  rightPill,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  rightPill?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.iconWrap}>
            <Ionicons name={icon} size={18} color="#111" />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>

        {!!rightPill && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{rightPill}</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardSubtitle}>{subtitle}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardCta}>Abrir</Text>
        <Ionicons name="chevron-forward" size={18} color="#111" />
      </View>
    </Pressable>
  );
}

export default function MemberHomeScreen() {
  const router = useRouter();
  const { user, token: ctxToken } = useAuth() as any;

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentCheckin, setCurrentCheckin] = useState<Checkin | null>(null);
  const [plansCount, setPlansCount] = useState<number | null>(null);

  const firstName = useMemo(() => {
    const raw = (user?.name as string) || "";
    const t = String(raw).trim();
    return t ? t.split(" ")[0] : "Jugador";
    console.log(user.name);
  }, [user]);

  async function getTokenOrThrow() {
    const t = ctxToken || (await getStoredToken?.());
    if (!t) throw new Error("No hay token. Necesitás estar logueado.");
    return t;
  }

  async function load() {
    const token = await getTokenOrThrow();

    const teamRes = await apiFetch<TeamMeResponse>("/teams/me", token);
    setTeam(teamRes.team);

    // Chequeo actual (si ya existe esta semana)
    const chk = await apiFetch<CurrentCheckinResponse>("/checkins/me/current", token);
    setCurrentCheckin(chk.item);

    // Planes semanales del equipo (si el backend lo permite para member)
    // Si tu backend lo restringe a coach, esto puede devolver 403; lo manejamos silencioso.
    try {
      const plans = await apiFetch<TeamWeekPlansResponse>(
        `/plans/team-week?date=${encodeURIComponent(new Date().toISOString().slice(0, 10))}`,
        token
      );
      setPlansCount(Array.isArray(plans.plans) ? plans.plans.length : 0);
    } catch {
      setPlansCount(null);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "No se pudo cargar Inicio");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkinPill = useMemo(() => (currentCheckin ? "Hecho ✅" : "Pendiente"), [currentCheckin]);

  const focusHint = useMemo(() => {
    // Si después guardás “focus” del equipo en backend, lo mostramos acá.
    // Por ahora: si hay planes y no está restringido, mostramos conteo.
    if (plansCount == null) return "Ver foco y objetivos del equipo";
    if (plansCount === 0) return "Aún no hay plan semanal";
    return `Plan semanal: ${plansCount} item${plansCount === 1 ? "" : "s"}`;
  }, [plansCount]);

  return (
    <>
      <Stack.Screen options={{ title: "Inicio", headerTitleAlign: "center" }} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {firstName}</Text>
          <Text style={styles.headerSubtitle}>
            Entrá rápido al chequeo, mirá el foco del equipo y seguí tu progreso.
          </Text>

          {!!team && (
            <View style={styles.teamPill}>
              <Ionicons name="people-outline" size={16} color="#111" />
              <Text style={styles.teamPillText}>{team.name}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={[styles.card, { alignItems: "center", gap: 10 }]}>
            <ActivityIndicator />
            <Text style={{ color: "#444" }}>Cargando…</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Card
              title="Chequeo"
              subtitle={currentCheckin ? "Ya completaste el chequeo de esta semana." : "Te falta el chequeo de esta semana."}
              icon="clipboard-outline"
              rightPill={checkinPill}
              onPress={() => router.push("/(memberTabs)/checkin")}
            />

            <Card
              title="Plan"
              subtitle={focusHint}
              icon="people-outline"
              onPress={() => router.push("/(memberTabs)/plan")}
            />

            <Card
              title="Progreso"
              subtitle="Tus tendencias y evolución por semana."
              icon="trending-up-outline"
              onPress={() => router.push("/(memberTabs)/progress")}
            />

            <Card
              title="Herramientas"
              subtitle="Ejercicios y recursos recomendados por DAN."
              icon="construct-outline"
              onPress={() => router.push("/(memberTabs)/tools")}
            />
<Card
              title="Dan"
              subtitle="Ejercicios y recursos recomendados por DAN."
              icon="construct-outline"
              onPress={() => router.push("/(memberTabs)/dan")}
            />
            <Pressable
              onPress={async () => {
                try {
                  setLoading(true);
                  await load();
                  Alert.alert("Actualizado", "Listo.");
                } catch (e: any) {
                  Alert.alert("Error", e?.message ?? "No se pudo refrescar");
                } finally {
                  setLoading(false);
                }
              }}
              style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="refresh" size={18} color="#111" />
              <Text style={styles.refreshText}>Refrescar</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
    backgroundColor: "#F6F6F6",
  },

  header: { gap: 8 },
  greeting: { fontSize: 24, fontWeight: "900", color: "#111" },
  headerSubtitle: { fontSize: 13, color: "#444", lineHeight: 18 },

  teamPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  teamPillText: { fontSize: 12, fontWeight: "800", color: "#111" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111", flexShrink: 1 },
  cardSubtitle: { marginTop: 8, fontSize: 13, color: "#444", lineHeight: 18 },
  cardFooter: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 6 },
  cardCta: { fontSize: 13, fontWeight: "800", color: "#111" },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#111" },
  pillText: { color: "#fff", fontSize: 12, fontWeight: "900" },

  refreshBtn: {
    marginTop: 4,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  refreshText: { fontSize: 13, fontWeight: "900", color: "#111" },
});