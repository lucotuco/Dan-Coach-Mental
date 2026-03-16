// app/memebertabs/checkin.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useAuth, getStoredToken } from "@/components/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// ====== Types (según tu backend) ======
type Role = "coach" | "member";
type AnswerItem = { qid: string; value: number };
type AnswersByAxis = Record<string, AnswerItem[]>;

type Checkin = {
  _id: string;
  teamId: string;
  userId: { _id: string; name: string; email: string; role: Role } | string;
  weekStart: string;
  createdAt: string;
  answers: AnswersByAxis;
  scores?: Record<string, number>;
  notes?: string;
};

type CurrentCheckinResponse = { item: Checkin | null };

// ====== Axes (DEBEN matchear tu backend) ======
const AXES = [
  { key: "confianza", title: "Confianza" },
  { key: "disciplina", title: "Disciplina" },
  { key: "persistencia", title: "Persistencia" },
  { key: "concentracion", title: "Concentración" },
  { key: "vinculacion", title: "Vinculación" },
  { key: "regulacionEmocional", title: "Regulación emocional" },
  { key: "superacion", title: "Superación" },
  { key: "liderazgo", title: "Liderazgo" },
] as const;

// ====== Preguntas (3 por eje) ======
const QUESTIONS: Record<
  (typeof AXES)[number]["key"],
  { qid: string; title: string; help: string }[]
> = {
  confianza: [
    {
      qid: "confianza_1",
      title: "Autoconfianza hoy",
      help: "¿Qué tan seguro estás de tu nivel y de poder rendir bien si tuvieras que competir hoy? 1 = nada seguro, 10 = totalmente seguro.",
    },
    {
      qid: "confianza_2",
      title: "Confianza bajo presión",
      help: "Cuando hay presión o errores, ¿qué tan capaz te sentís de mantenerte firme y ejecutar igual? 1 = me caigo, 10 = me fortalece.",
    },
    {
      qid: "confianza_3",
      title: "Confianza en tus decisiones",
      help: "¿Qué tan claro estás para decidir rápido y sostener tus decisiones sin dudar? 1 = dudo mucho, 10 = decido y sostengo.",
    },
  ],
  disciplina: [
    {
      qid: "disciplina_1",
      title: "Cumplimiento de hábitos",
      help: "¿Qué tan bien cumpliste con lo que dijiste que ibas a hacer (entreno, descanso, comida, rutina)? 1 = casi nada, 10 = impecable.",
    },
    {
      qid: "disciplina_2",
      title: "Consistencia sin motivación",
      help: "¿Qué tan capaz fuiste de hacer lo que toca aunque no tuvieras ganas? 1 = no pude, 10 = lo hice igual.",
    },
    {
      qid: "disciplina_3",
      title: "Respetar el plan",
      help: "¿Qué tan alineado estuviste con el plan del equipo/tu plan personal? 1 = me desvié mucho, 10 = muy alineado.",
    },
  ],
  persistencia: [
    {
      qid: "persistencia_1",
      title: "Seguir a pesar de obstáculos",
      help: "Cuando algo salió mal, ¿qué tanto seguiste insistiendo? 1 = abandoné, 10 = seguí igual.",
    },
    {
      qid: "persistencia_2",
      title: "Tolerancia a la frustración",
      help: "¿Qué tan bien manejaste la frustración sin desconcentrarte o bajar los brazos? 1 = me afectó mucho, 10 = casi no me afectó.",
    },
    {
      qid: "persistencia_3",
      title: "Energía sostenida",
      help: "¿Qué tan bien lograste sostener tu energía mental a lo largo del día/semana? 1 = me apagué rápido, 10 = la sostuve bien.",
    },
  ],
  concentracion: [
    {
      qid: "concentracion_1",
      title: "Enfoque durante tareas",
      help: "¿Qué tan fácil te fue mantenerte enfocado cuando entrenabas/estudiabas/trabajabas? 1 = me distraía siempre, 10 = muy enfocado.",
    },
    {
      qid: "concentracion_2",
      title: "Recuperar foco",
      help: "Si te distraías o cometías un error, ¿qué tan rápido volviste al foco? 1 = tardé mucho, 10 = volví enseguida.",
    },
    {
      qid: "concentracion_3",
      title: "Presencia en el momento",
      help: "¿Qué tan presente estuviste (sin irte a pensamientos del pasado/futuro)? 1 = nada presente, 10 = muy presente.",
    },
  ],
  vinculacion: [
    {
      qid: "vinculacion_1",
      title: "Conexión con el equipo",
      help: "¿Qué tan conectado te sentiste con tu equipo (comunicación, apoyo, confianza)? 1 = desconectado, 10 = muy conectado.",
    },
    {
      qid: "vinculacion_2",
      title: "Aporte al clima",
      help: "¿Qué tanto aportaste a un buen clima (actitud, respeto, energía)? 1 = resté, 10 = sumé mucho.",
    },
    {
      qid: "vinculacion_3",
      title: "Confianza para pedir/recibir ayuda",
      help: "¿Qué tan cómodo estuviste pidiendo ayuda o recibiendo feedback? 1 = nada cómodo, 10 = muy cómodo.",
    },
  ],
  regulacionEmocional: [
    {
      qid: "regulacionEmocional_1",
      title: "Control emocional",
      help: "¿Qué tan bien manejaste tus emociones (enojo, ansiedad, frustración) para que no te dominen? 1 = me dominaron, 10 = las manejé bien.",
    },
    {
      qid: "regulacionEmocional_2",
      title: "Calmarte cuando sube la intensidad",
      help: "Cuando te aceleraste, ¿qué tan rápido pudiste bajar a un estado útil? 1 = no pude, 10 = muy rápido.",
    },
    {
      qid: "regulacionEmocional_3",
      title: "Reacción ante errores",
      help: "¿Qué tan bien reaccionaste a errores (sin castigarte ni salirte del plan)? 1 = me hundí, 10 = lo manejé bien.",
    },
  ],
  superacion: [
    {
      qid: "superacion_1",
      title: "Búsqueda de mejora",
      help: "¿Qué tanto buscaste mejorar esta semana (corregir, practicar, aprender)? 1 = nada, 10 = mucho.",
    },
    {
      qid: "superacion_2",
      title: "Feedback y corrección",
      help: "¿Qué tanto aceptaste feedback y lo convertiste en acción? 1 = me costó, 10 = lo usé muy bien.",
    },
    {
      qid: "superacion_3",
      title: "Mentalidad de crecimiento",
      help: "¿Qué tan presente estuvo la idea de 'puedo mejorar' frente a desafíos? 1 = mentalidad fija, 10 = crecimiento total.",
    },
  ],
  liderazgo: [
    {
      qid: "liderazgo_1",
      title: "Dar el ejemplo",
      help: "¿Qué tanto lideraste con el ejemplo (actitud, disciplina, compromiso)? 1 = nada, 10 = mucho.",
    },
    {
      qid: "liderazgo_2",
      title: "Comunicación útil",
      help: "¿Qué tan útil fue tu comunicación con otros (clara, respetuosa, constructiva)? 1 = poco útil, 10 = muy útil.",
    },
    {
      qid: "liderazgo_3",
      title: "Responsabilidad",
      help: "¿Qué tan responsable fuiste con tus decisiones y acciones? 1 = evité responsabilidad, 10 = me hice cargo.",
    },
  ],
};

function clamp(n: number) {
  return Math.max(1, Math.min(10, n));
}

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

function defaultAnswers(): AnswersByAxis {
  const out: AnswersByAxis = {};
  for (const ax of AXES) {
    out[ax.key] = QUESTIONS[ax.key].map((q) => ({ qid: q.qid, value: 5 }));
  }
  return out;
}

function calcScoresFromAnswers(answers: AnswersByAxis): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const ax of AXES) {
    const arr = answers[ax.key] || [];
    const vals = arr.map((x) => x.value).filter((v) => typeof v === "number" && !Number.isNaN(v));
    const avg = vals.length ? vals.reduce((p, c) => p + c, 0) / vals.length : 0;
    scores[ax.key] = Number(avg.toFixed(1));
  }
  return scores;
}

function QuestionSlider({
  title,
  help,
  value,
  onChange,
}: {
  title: string;
  help: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={qsStyles.wrap}>
      <View style={qsStyles.topRow}>
        <Text style={qsStyles.title}>{title}</Text>
        <View style={qsStyles.badge}>
          <Text style={qsStyles.badgeText}>{value}</Text>
        </View>
      </View>

      <Text style={qsStyles.help}>{help}</Text>

      <Slider
        style={{ width: "100%", height: 34 }}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#111"
        maximumTrackTintColor="#d9d9d9"
        thumbTintColor="#111"
      />

      <View style={qsStyles.scale}>
        <Text style={qsStyles.scaleText}>1</Text>
        <Text style={qsStyles.scaleText}>10</Text>
      </View>
    </View>
  );
}

const qsStyles = StyleSheet.create({
  wrap: { gap: 6, paddingVertical: 10 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { fontSize: 13, fontWeight: "900", color: "#111", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#111" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  help: { fontSize: 12, color: "#555", lineHeight: 16 },
  scale: { flexDirection: "row", justifyContent: "space-between" },
  scaleText: { fontSize: 12, color: "#666", fontWeight: "700" },
});

export default function MemberCheckinScreen() {
  const { user, token: ctxToken } = useAuth() as any;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [current, setCurrent] = useState<Checkin | null>(null);
  const [answers, setAnswers] = useState<AnswersByAxis>(() => defaultAnswers());
  const [notes, setNotes] = useState("");

  const firstName = useMemo(() => {
    const raw = (user?.name as string) || "";
    const t = String(raw).trim();
    return t ? t.split(" ")[0] : "Jugador";
  }, [user]);

  async function getTokenOrThrow() {
    const t = ctxToken || (await getStoredToken?.());
    if (!t) throw new Error("No hay token. Necesitás estar logueado.");
    return t;
  }

  async function loadCurrent() {
    const token = await getTokenOrThrow();
    const res = await apiFetch<CurrentCheckinResponse>("/checkins/me/current", token);
    setCurrent(res.item);
    if (res.item?.notes) setNotes(res.item.notes);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadCurrent();
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "No se pudo cargar el chequeo");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateValue(axisKey: string, idx: number, next: number) {
    setAnswers((prev) => {
      const copy: AnswersByAxis = { ...prev };
      const arr = [...(copy[axisKey] || [])];
      if (!arr[idx]) return prev;
      arr[idx] = { ...arr[idx], value: clamp(next) };
      copy[axisKey] = arr;
      return copy;
    });
  }

  function validatePayload(a: AnswersByAxis) {
    for (const ax of AXES) {
      const arr = a[ax.key];
      if (!Array.isArray(arr) || arr.length < 3) return `Faltan respuestas en ${ax.title}`;
      for (const it of arr.slice(0, 3)) {
        if (!it?.qid) return `qid vacío en ${ax.title}`;
        if (typeof it.value !== "number" || it.value < 1 || it.value > 10) return `Valor inválido en ${ax.title}`;
      }
    }
    return null;
  }

  async function submit() {
    try {
      const err = validatePayload(answers);
      if (err) {
        Alert.alert("Chequeo incompleto", err);
        return;
      }

      setSubmitting(true);
      const token = await getTokenOrThrow();

      await apiFetch<{ ok: true; id: string }>(
        "/checkins",
        token,
        {
          method: "POST",
          body: JSON.stringify({
            answers,
            notes: notes?.trim() ? notes.trim() : undefined,
          }),
        }
      );

      await loadCurrent();
      Alert.alert("Listo", "Chequeo enviado.");
    } catch (e: any) {
      if (e?.status === 409) {
        Alert.alert("Ya está hecho", "Ya existe un chequeo para esta semana.");
        await loadCurrent();
        return;
      }
      Alert.alert("No se pudo enviar", e?.message ?? "Error");
    } finally {
      setSubmitting(false);
    }
  }

  const displayScores = useMemo(() => {
    if (current?.scores) return current.scores;
    if (current?.answers) return calcScoresFromAnswers(current.answers);
    return null;
  }, [current]);

  return (
    <>
      <Stack.Screen options={{ title: "Chequeo", headerTitleAlign: "center" }} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hola, {firstName}</Text>
          <Text style={styles.subtitle}>
            Respondé cada pregunta del 1 al 10. 1 = muy bajo, 10 = excelente.
          </Text>
        </View>

        {loading ? (
          <View style={[styles.card, { alignItems: "center", gap: 10 }]}>
            <ActivityIndicator />
            <Text style={{ color: "#444" }}>Cargando…</Text>
          </View>
        ) : current ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chequeo de esta semana ✅</Text>
            <Text style={styles.cardSub}>
              Ya completaste el chequeo. Abajo tenés tu resumen.
            </Text>

            {!!displayScores && (
              <View style={{ marginTop: 12, gap: 8 }}>
                {AXES.map((ax) => (
                  <View key={ax.key} style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>{ax.title}</Text>
                    <Text style={styles.scoreValue}>
                      {Number(displayScores[ax.key] ?? 0).toFixed(1)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
              <Pressable
                 onPress={() => router.push("/(memberTabs)/plan")}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Ver plan</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {AXES.map((ax) => (
              <View key={ax.key} style={styles.card}>
                <Text style={styles.cardTitle}>{ax.title}</Text>
                <Text style={styles.cardSub}>Respondé 3 preguntas</Text>

                <View style={{ marginTop: 10 }}>
                  {QUESTIONS[ax.key].map((q, idx) => {
                    const value = answers[ax.key]?.[idx]?.value ?? 5;
                    return (
                      <QuestionSlider
                        key={q.qid}
                        title={q.title}
                        help={q.help}
                        value={value}
                        onChange={(v) => updateValue(ax.key, idx, v)}
                      />
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notas (opcional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Algo para que DAN tenga contexto…"
                placeholderTextColor="#888"
                style={styles.notes}
                multiline
              />

              <Pressable
                onPress={submit}
                style={[styles.primaryBtn, submitting && { opacity: 0.8 }]}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.primaryBtnText}>Enviar chequeo</Text>
                  </View>
                )}
              </Pressable>

              {Platform.OS === "web" && (
                <Text style={styles.webHint}>
                  Nota: en web, el Alert se ve como popup del navegador.
                </Text>
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
  header: { gap: 6 },
  title: { fontSize: 22, fontWeight: "900", color: "#111" },
  subtitle: { fontSize: 13, color: "#444", lineHeight: 18 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  cardSub: { marginTop: 6, fontSize: 13, color: "#444", lineHeight: 18 },

  notes: {
    marginTop: 10,
    minHeight: 90,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#eee",
    color: "#111",
    textAlignVertical: "top",
  },

  primaryBtn: {
    marginTop: 12,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "900" },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#111", fontSize: 13, fontWeight: "900" },

  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreLabel: { fontSize: 13, color: "#111", fontWeight: "700" },
  scoreValue: { fontSize: 13, color: "#111", fontWeight: "900" },

  webHint: { marginTop: 10, fontSize: 12, color: "#666" },
});