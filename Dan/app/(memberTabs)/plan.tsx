// app/memebertabs/plan.tsx
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
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, getStoredToken } from "@/components/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type Role = "coach" | "member";
type PlanAxis =
  | "confianza"
  | "disciplina"
  | "persistencia"
  | "concentracion"
  | "vinculacion"
  | "regulacionEmocional"
  | "superacion"
  | "liderazgo";

type PlanItem = {
  id: string;
  axis: PlanAxis;
  title: string;
  description: string;
  done: boolean;
  dayHint: number | null;
};

type WeeklyPlan = {
  _id: string;
  teamId: string;
  userId: { _id: string; name: string; email: string; role: Role } | string;
  weekStart: string;
  focusAxes: PlanAxis[];
  items: PlanItem[];
  status: "active" | "completed";
  createdAt: string;
};

type CurrentPlanResponse = { plan: WeeklyPlan | null };
type ListMyPlansResponse = { items: WeeklyPlan[] }; // si no existe aún, te digo cómo agregarlo

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

function axisLabel(ax: string) {
  const map: Record<string, string> = {
    confianza: "Confianza",
    disciplina: "Disciplina",
    persistencia: "Persistencia",
    concentracion: "Concentración",
    vinculacion: "Vinculación",
    regulacionEmocional: "Regulación emocional",
    superacion: "Superación",
    liderazgo: "Liderazgo",
  };
  return map[ax] || ax;
}

function completionPct(items: PlanItem[]) {
  if (!items?.length) return 0;
  const done = items.filter((i) => i.done).length;
  return Number(((done / items.length) * 100).toFixed(1));
}

export default function MemberPlanScreen() {
  const router = useRouter();
  const { token: ctxToken } = useAuth() as any;

  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [pastPlans, setPastPlans] = useState<WeeklyPlan[]>([]);

  async function getTokenOrThrow() {
    const t = ctxToken || (await getStoredToken?.());
    if (!t) throw new Error("No hay token. Necesitás estar logueado.");
    return t;
  }

  async function load() {
    const token = await getTokenOrThrow();

    const cur = await apiFetch<CurrentPlanResponse>("/plans/me/current", token);
    setPlan(cur.plan);

    // ✅ Planes pasados:
    // Si todavía NO tenés endpoint, te conviene crearlo:
    // GET /plans/me?limit=20  -> { items: [...] }
    // Por ahora intentamos y si falla lo dejamos vacío.
    try {
      const hist = await apiFetch<ListMyPlansResponse>("/plans/me?limit=20", token);
      // sacamos el actual si viene repetido
      const filtered = (hist.items || []).filter((p) => !cur.plan || p._id !== cur.plan._id);
      setPastPlans(filtered);
    } catch {
      setPastPlans([]);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "No se pudo cargar el plan");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleItem(itemId: string, nextDone: boolean) {
    const token = await getTokenOrThrow();
    try {
      setToggling(itemId);

      const res = await apiFetch<{ ok: true; status: "active" | "completed"; items: PlanItem[] }>(
        `/plans/me/current/items/${encodeURIComponent(itemId)}`,
        token,
        { method: "PATCH", body: JSON.stringify({ done: nextDone }) }
      );

      setPlan((prev) => (prev ? { ...prev, status: res.status, items: res.items } : prev));
    } catch (e: any) {
      Alert.alert("No se pudo actualizar", e?.message ?? "Error");
    } finally {
      setToggling(null);
    }
  }

  const pct = useMemo(() => (plan ? completionPct(plan.items) : 0), [plan]);

  return (
    <>
      <Stack.Screen options={{ title: "Plan semanal", headerTitleAlign: "center" }} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={[styles.card, { alignItems: "center", gap: 10 }]}>
            <ActivityIndicator />
            <Text style={{ color: "#444" }}>Cargando…</Text>
          </View>
        ) : !plan ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No hay plan aún</Text>
            <Text style={styles.cardSub}>
              Completá el chequeo semanal para que se genere tu plan.
            </Text>

            <Pressable onPress={() => router.push("/(memberTabs)/checkin")} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Ir al chequeo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Plan actual */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Semana actual</Text>
                <View style={styles.pillDark}>
                  <Text style={styles.pillDarkText}>{pct}%</Text>
                </View>
              </View>

              <Text style={styles.cardSub}>
                Foco: {plan.focusAxes.map(axisLabel).join(" · ")}
              </Text>

              <View style={styles.chipsRow}>
                {plan.focusAxes.map((ax) => (
                  <View key={ax} style={styles.chip}>
                    <Text style={styles.chipText}>{axisLabel(ax)}</Text>
                  </View>
                ))}
              </View>

              <View style={{ marginTop: 12, gap: 10 }}>
                {plan.items.map((it) => (
                  <Pressable
                    key={it.id}
                    onPress={() => toggleItem(it.id, !it.done)}
                    style={({ pressed }) => [
                      styles.itemRow,
                      pressed && { opacity: 0.92 },
                    ]}
                  >
                    <View style={styles.itemLeft}>
                      <View style={[styles.checkbox, it.done && styles.checkboxDone]}>
                        {it.done && <Ionicons name="checkmark" size={16} color="#fff" />}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{it.title}</Text>
                        <Text style={styles.itemDesc}>{it.description}</Text>
                        <Text style={styles.itemMeta}>
                          {axisLabel(it.axis)}
                          {it.dayHint != null ? ` · Día ${it.dayHint}` : ""}
                        </Text>
                      </View>
                    </View>

                    {toggling === it.id ? (
                      <ActivityIndicator />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#111" />
                    )}
                  </Pressable>
                ))}
              </View>

              <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => {
                    // acá navegás a tu chat DAN real
                    Alert.alert("DAN", "Acá abrís el chat con DAN con el plan como contexto.");
                  }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Discutir con DAN</Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    setLoading(true);
                    try {
                      await load();
                      Alert.alert("Actualizado", "Listo.");
                    } catch (e: any) {
                      Alert.alert("Error", e?.message ?? "No se pudo refrescar");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Refrescar</Text>
                </Pressable>
              </View>
            </View>

            {/* Planes pasados */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Planes pasados</Text>
              <Text style={styles.cardSub}>
                Revisá tus semanas anteriores para ver continuidad.
              </Text>

              {pastPlans.length === 0 ? (
                <Text style={{ marginTop: 10, color: "#555" }}>
                  (Todavía no hay historial, o falta el endpoint /plans/me)
                </Text>
              ) : (
                <View style={{ marginTop: 10, gap: 10 }}>
                  {pastPlans.map((p) => {
                    const pct = completionPct(p.items);
                    return (
                      <Pressable
                        key={p._id}
                        onPress={() => router.push(`/(memberTabs)/dan`)}
                        style={({ pressed }) => [styles.pastRow, pressed && { opacity: 0.92 }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pastTitle}>
                            Semana {new Date(p.weekStart).toLocaleDateString()}
                          </Text>
                          <Text style={styles.pastSub}>
                            {p.focusAxes.map(axisLabel).join(" · ")} · {pct}% · {p.status}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#111" />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </>
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
    gap: 12,
    backgroundColor: "#F6F6F6",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  cardSub: { marginTop: 6, fontSize: 13, color: "#444", lineHeight: 18 },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  pillDark: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#111" },
  pillDarkText: { color: "#fff", fontSize: 12, fontWeight: "900" },

  chipsRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: "#f2f2f2" },
  chipText: { fontSize: 12, fontWeight: "900", color: "#111" },

  itemRow: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  itemLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10, flex: 1 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxDone: { backgroundColor: "#111", borderColor: "#111" },

  itemTitle: { fontSize: 14, fontWeight: "900", color: "#111" },
  itemDesc: { marginTop: 2, fontSize: 13, color: "#444", lineHeight: 18 },
  itemMeta: { marginTop: 6, fontSize: 12, color: "#666", fontWeight: "700" },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "900" },

  secondaryBtn: {
    paddingHorizontal: 12,
    backgroundColor: "#f2f2f2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#111", fontSize: 13, fontWeight: "900" },

  pastRow: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pastTitle: { fontSize: 13, fontWeight: "900", color: "#111" },
  pastSub: { marginTop: 2, fontSize: 12, color: "#555" },
});