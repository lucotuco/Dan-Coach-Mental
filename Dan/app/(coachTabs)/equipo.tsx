import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useAuth, getStoredToken } from "@/components/AuthContext";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

type Role = "coach" | "member";
type Member = { userId: string; name: string; email: string; role: Role; createdAt?: string };

type Team = {
  teamId: string;
  name: string;
  type: string;
  joinCode: string;
  ownerUserId: string;
  createdAt?: string;
  updatedAt?: string;
};

type TeamMeResponse = { team: Team | null };
type MembersResponse = { members: Member[] };

type CheckinItem = {
  _id: string;
  weekStart: string;
  createdAt: string;
  userId: { _id: string; name: string; email: string; role: Role };
  scores?: Record<string, number>;
};

type TeamWeekCheckinsResponse = {
  weekStart: string;
  items: CheckinItem[];
  teamAverages: Record<string, number> | null;
  completion: { completed: number; total: number; pct: number };
};

type PlanItem = { id: string; axis: string; title: string; description: string; done: boolean; dayHint?: string | null };
type WeeklyPlan = {
  _id: string;
  teamId: string;
  userId: { _id: string; name: string; email: string; role: Role };
  weekStart: string;
  focusAxes: string[];
  items: PlanItem[];
  status: string;
  createdAt: string;
};

type TeamWeekPlansResponse = { weekStart: string; plans: WeeklyPlan[] };

type AlertItem = {
  id: string;
  kind: "pending" | "brusque_drop" | "info";
  title: string;
  detail?: string;
};

type MemberStatus = "ok" | "warning" | "risk" | "pending";
type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  pendingCheckin: boolean;
  delta?: number;
  status: MemberStatus;
};

const roleLabel: Record<Role, string> = { coach: "Coach", member: "Jugador" };

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function avgScores(scores?: Record<string, number>) {
  if (!scores) return null;
  const vals = Object.values(scores).filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!vals.length) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return sum / vals.length;
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

/** Alerts/Confirms cross-platform */
function showMsg(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
function confirmMsg(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    const ok = window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel" },
    { text: "Confirmar", style: "destructive", onPress: onConfirm },
  ]);
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.9 }]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StatusDot({ status }: { status: MemberStatus }) {
  const bg =
    status === "ok" ? "#2ecc71" :
    status === "warning" ? "#f1c40f" :
    status === "risk" ? "#e74c3c" : "#95a5a6";
  return <View style={[styles.dot, { backgroundColor: bg }]} />;
}

export default function CoachTeamScreen() {
  const router = useRouter();
  const { user, token: ctxToken } = useAuth() as any;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberRows, setMemberRows] = useState<MemberRow[]>([]);

  const [weekCheckins, setWeekCheckins] = useState<TeamWeekCheckinsResponse | null>(null);
  const [weekPlans, setWeekPlans] = useState<TeamWeekPlansResponse | null>(null);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState("");

  const [search, setSearch] = useState("");
  type FilterKey = "all" | "pending" | "changeBrusco";
  const [filter, setFilter] = useState<FilterKey>("all");

  const firstName = useMemo(() => {
    const raw = (user?.name as string) || "";
    const t = String(raw).trim();
    return t ? t.split(" ")[0] : "Coach";
  }, [user]);

  async function getTokenOrThrow() {
    const t = ctxToken || (await getStoredToken?.());
    if (!t) throw new Error("No hay token. Necesitás estar logueado.");
    return t;
  }

  async function refetchAll(showSpinner = true) {
    const token = await getTokenOrThrow();
    if (showSpinner) setLoading(true);

    try {
      const teamRes = await apiFetch<TeamMeResponse>("/teams/me", token);
      setTeam(teamRes.team);

      if (!teamRes.team) {
        setMembers([]);
        setMemberRows([]);
        setWeekCheckins(null);
        setWeekPlans(null);
        setAlerts([]);
        return;
      }

      const memRes = await apiFetch<MembersResponse>("/teams/me/members", token);
      setMembers(memRes.members);

      const now = new Date();
      const current = await apiFetch<TeamWeekCheckinsResponse>(
        `/checkins/team-week?date=${encodeURIComponent(toISODate(now))}`,
        token
      );
      setWeekCheckins(current);

      const plans = await apiFetch<TeamWeekPlansResponse>(
        `/plans/team-week?date=${encodeURIComponent(toISODate(now))}`,
        token
      );
      setWeekPlans(plans);

      const prevDate = addDays(new Date(current.weekStart), -7);
      let prev: TeamWeekCheckinsResponse | null = null;
      try {
        prev = await apiFetch<TeamWeekCheckinsResponse>(
          `/checkins/team-week?date=${encodeURIComponent(toISODate(prevDate))}`,
          token
        );
      } catch {
        prev = null;
      }

      const completedSet = new Set(current.items.map((it) => String(it.userId?._id)));
      const prevAvgByUser = new Map<string, number>();
      if (prev) {
        for (const it of prev.items) {
          const uid = String(it.userId?._id);
          const a = avgScores(it.scores);
          if (a != null) prevAvgByUser.set(uid, a);
        }
      }

      const rows: MemberRow[] = memRes.members.map((m) => {
        const pending = !completedSet.has(m.userId);

        let delta: number | undefined;
        if (prev) {
          const curItem = current.items.find((it) => String(it.userId?._id) === m.userId);
          const curAvg = avgScores(curItem?.scores);
          const prevAvg = prevAvgByUser.get(m.userId);
          if (curAvg != null && prevAvg != null) delta = Number((curAvg - prevAvg).toFixed(1));
        }

        let status: MemberStatus = "ok";
        if (pending) status = "pending";
        else if (typeof delta === "number" && delta <= -2) status = "risk";
        else if (typeof delta === "number" && delta <= -1) status = "warning";

        return { id: m.userId, name: m.name, email: m.email, role: m.role, pendingCheckin: pending, delta, status };
      });

      rows.sort((a, b) => (a.role === "coach" ? -1 : b.role === "coach" ? 1 : 0));
      setMemberRows(rows);

      const pendingCount = rows.filter((r) => r.pendingCheckin).length;
      const brusqueCount = rows.filter((r) => typeof r.delta === "number" && r.delta <= -2).length;

      const alertList: AlertItem[] = [];
      if (pendingCount > 0) {
        alertList.push({
          id: "pending",
          kind: "pending",
          title: `${pendingCount} ${pendingCount === 1 ? "miembro" : "miembros"} sin check-in esta semana`,
          detail: "Filtrá por Pendientes para hacer seguimiento.",
        });
      }
      if (brusqueCount > 0) {
        alertList.push({
          id: "brusque_drop",
          kind: "brusque_drop",
          title: `Cambio brusco (Δ <= -2) en ${brusqueCount} ${brusqueCount === 1 ? "jugador" : "jugadores"}`,
          detail: "Revisá perfiles y contexto (comparado con la semana anterior).",
        });
      }
      setAlerts(alertList);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    refetchAll(true).catch((e: any) => showMsg("Error", e?.message ?? "No se pudo cargar Equipo"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onAddMember() {
    const email = emailToAdd.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      showMsg("Mail inválido", "Ingresá un mail válido.");
      return;
    }

    const token = await getTokenOrThrow();
    try {
      await apiFetch<{ ok: true; memberId: string }>(
        "/teams/me/members",
        token,
        { method: "POST", body: JSON.stringify({ email }) }
      );
      setAddOpen(false);
      setEmailToAdd("");
      setRefreshing(true);
      await refetchAll(false);
    } catch (e: any) {
      showMsg("No se pudo añadir", e?.message ?? "Error");
    } finally {
      setRefreshing(false);
    }
  }

  async function onRemoveMember(memberUserId: string) {
    const token = await getTokenOrThrow();
    try {
      await apiFetch<{ ok: true }>(
        `/teams/me/members/${encodeURIComponent(memberUserId)}/remove`,
        token,
        { method: "PATCH" }
      );
      setRefreshing(true);
      await refetchAll(false);
    } catch (e: any) {
      showMsg("No se pudo sacar", e?.message ?? "Error");
    } finally {
      setRefreshing(false);
    }
  }

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = memberRows;

    if (filter === "pending") base = base.filter((m) => m.pendingCheckin);
    if (filter === "changeBrusco") base = base.filter((m) => (m.delta ?? 0) <= -2);

    if (q) base = base.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    return base;
  }, [memberRows, search, filter]);

  const completionText = useMemo(() => {
    if (!weekCheckins) return "-/-";
    return `${weekCheckins.completion.completed}/${weekCheckins.completion.total}`;
  }, [weekCheckins]);

  const pendingCount = useMemo(() => memberRows.filter((m) => m.pendingCheckin).length, [memberRows]);
  const plansCount = useMemo(() => weekPlans?.plans?.length ?? 0, [weekPlans]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Equipo",
          headerTitleAlign: "center",
          headerRight: () => (
            <Pressable onPress={() => router.push("/coach/config")} style={styles.iconBtn} hitSlop={10}>
              <Ionicons name="settings-outline" size={22} color="#111" />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text style={styles.title}>{team?.name ?? "Sin equipo"}</Text>
          <Text style={styles.subTitle}>Hola, {firstName}.</Text>

          {!!team && (
            <View style={styles.topRow}>
              <View style={styles.metaPill}>
                <Ionicons name="people-outline" size={16} color="#111" />
                <Text style={styles.metaPillText}>Miembros: {members.length}</Text>
              </View>

              <Pressable onPress={() => setAlertsOpen(true)} style={styles.attentionPill} hitSlop={10}>
                <Text style={styles.attentionText}>Atención ({alerts.length})</Text>
              </Pressable>
            </View>
          )}
        </View>

        {loading && (
          <View style={[styles.sectionCard, { alignItems: "center", gap: 10 }]}>
            <ActivityIndicator />
            <Text style={{ color: "#444" }}>Cargando…</Text>
          </View>
        )}

        {!loading && !team && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>No tenés equipo</Text>
            <Text style={styles.sectionDesc}>Creá uno desde el onboarding.</Text>
          </View>
        )}

        {!!team && !loading && (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="checkbox-outline" size={18} color="#111" />
                  </View>
                  <Text style={styles.sectionTitle}>Adherencia semanal</Text>
                </View>
                <Text style={styles.kpi}>{completionText}</Text>
              </View>

              <Text style={styles.sectionDesc}>
                Pendientes: {pendingCount}. Planes generados esta semana: {plansCount}.
              </Text>

              <View style={styles.sectionActionsRow}>
                <Pressable onPress={() => setFilter("pending")} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Ver pendientes</Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    setRefreshing(true);
                    try {
                      await refetchAll(false);
                    } catch (e: any) {
                      showMsg("Error", e?.message ?? "No se pudo refrescar");
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                  style={styles.primaryBtn}
                >
                  {refreshing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#fff" />
                      <Text style={styles.primaryBtnText}>Refrescar</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name="people-outline" size={18} color="#111" />
                  </View>
                  <Text style={styles.sectionTitle}>Miembros</Text>
                </View>

                <Pressable
                  onPress={() => {
                    setEmailToAdd("");
                    setAddOpen(true);
                  }}
                  style={styles.addBtn}
                >
                  <Ionicons name="add" size={18} color="#111" />
                  <Text style={styles.addBtnText}>Añadir</Text>
                </Pressable>
              </View>

              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color="#666" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por nombre o mail…"
                  placeholderTextColor="#888"
                  style={styles.searchInput}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.chipsRow}>
                <Chip label="Todos" active={filter === "all"} onPress={() => setFilter("all")} />
                <Chip label="Pendientes" active={filter === "pending"} onPress={() => setFilter("pending")} />
                <Chip label="Cambio brusco" active={filter === "changeBrusco"} onPress={() => setFilter("changeBrusco")} />
              </View>

              <View style={{ marginTop: 10, gap: 10 }}>
                {filteredMembers.map((m) => (
                  <View key={m.id} style={styles.memberRow}>
                    <Pressable onPress={() => router.push(`/coach/jugador/${m.id}`)} style={styles.memberLeft}>
                      <StatusDot status={m.status} />
                      <View style={{ flexShrink: 1 }}>
                        <Text style={styles.memberName} numberOfLines={1}>
                          {m.name} {m.role === "coach" ? "(Coach)" : ""}
                        </Text>
                        <Text style={styles.memberMeta} numberOfLines={1}>
                          {m.email} · {roleLabel[m.role]}
                          {m.pendingCheckin ? " · Pendiente" : ""}
                          {typeof m.delta === "number" ? ` · Δ ${m.delta > 0 ? "+" : ""}${m.delta}` : ""}
                        </Text>
                      </View>
                    </Pressable>

                    <View style={styles.memberRight}>
                      {m.role !== "coach" && (
                        <Pressable
                          onPress={() =>
                            confirmMsg("Sacar miembro", `¿Querés sacar a ${m.name} del equipo?`, () => onRemoveMember(m.id))
                          }
                          style={styles.removeBtn}
                          hitSlop={12}
                        >
                          <Ionicons name="trash-outline" size={18} color="#111" />
                        </Pressable>
                      )}
                      <Pressable onPress={() => router.push(`/coach/jugador/${m.id}`)} hitSlop={12}>
                        <Ionicons name="chevron-forward" size={18} color="#111" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* OVERLAY ALERTAS (sin Modal) */}
      {alertsOpen && (
        <View style={styles.overlayRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAlertsOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Atención</Text>
              <Pressable onPress={() => setAlertsOpen(false)} style={styles.iconBtn} hitSlop={10}>
                <Ionicons name="close" size={22} color="#111" />
              </Pressable>
            </View>

            {alerts.length === 0 ? (
              <Text style={{ color: "#444" }}>Sin alertas por ahora.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {alerts.map((a) => (
                  <View key={a.id} style={styles.alertRow}>
                    <View style={styles.alertIcon}>
                      <Ionicons name="alert-circle-outline" size={18} color="#111" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertTitle}>{a.title}</Text>
                      {!!a.detail && <Text style={styles.alertDetail}>{a.detail}</Text>}
                      <View style={styles.alertActions}>
                        {a.kind === "pending" && (
                          <Pressable onPress={() => { setAlertsOpen(false); setFilter("pending"); }} style={styles.smallBtn}>
                            <Text style={styles.smallBtnText}>Ver pendientes</Text>
                          </Pressable>
                        )}
                        {a.kind === "brusque_drop" && (
                          <Pressable onPress={() => { setAlertsOpen(false); setFilter("changeBrusco"); }} style={styles.smallBtn}>
                            <Text style={styles.smallBtnText}>Ver cambios</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* OVERLAY AÑADIR (sin Modal) */}
      {addOpen && (
        <View style={styles.overlayRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddOpen(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Añadir miembro por mail</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#666" />
              <TextInput
                value={emailToAdd}
                onChangeText={setEmailToAdd}
                placeholder="mail@dominio.com"
                placeholderTextColor="#888"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setAddOpen(false)} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={onAddMember} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Añadir</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 14, paddingHorizontal: 16, paddingBottom: 28, gap: 12, backgroundColor: "#F6F6F6" },
  top: { gap: 8 },
  title: { fontSize: 22, fontWeight: "900", color: "#111" },
  subTitle: { fontSize: 13, color: "#444", lineHeight: 18 },

  topRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  metaPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee",
  },
  metaPillText: { fontSize: 12, fontWeight: "800", color: "#111" },

  attentionPill: { marginLeft: "auto", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#111" },
  attentionText: { color: "#fff", fontSize: 12, fontWeight: "900" },

  sectionCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: "#eee",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 2 },
      default: {},
    }),
  },

  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#f3f3f3", alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  sectionDesc: { marginTop: 8, fontSize: 13, color: "#444", lineHeight: 18 },

  kpi: { fontSize: 14, fontWeight: "900", color: "#111" },

  sectionActionsRow: { marginTop: 12, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "space-between" },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "#111" },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  secondaryBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "#f2f2f2" },
  secondaryBtnText: { fontSize: 13, fontWeight: "900", color: "#111" },

  addBtn: { flexDirection: "row", gap: 6, alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: "#f2f2f2" },
  addBtnText: { fontSize: 12, fontWeight: "900", color: "#111" },

  searchWrap: {
    marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#eee",
    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },

  chipsRow: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: "#f2f2f2" },
  chipActive: { backgroundColor: "#111" },
  chipText: { fontSize: 12, fontWeight: "900", color: "#111" },
  chipTextActive: { color: "#fff" },

  memberRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, padding: 12, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" },
  memberLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  memberName: { fontSize: 14, fontWeight: "900", color: "#111" },
  memberMeta: { marginTop: 2, fontSize: 12, color: "#555" },
  memberRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  removeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#f2f2f2", alignItems: "center", justifyContent: "center" },

  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  // Overlays (sin Modal)
  overlayRoot: {
    position: "absolute",
    left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: 16,
  },

  sheet: { backgroundColor: "#fff", padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "#eee" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sheetTitle: { fontSize: 16, fontWeight: "900", color: "#111" },

  alertRow: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 14, backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#eee" },
  alertIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: 13, fontWeight: "900", color: "#111" },
  alertDetail: { marginTop: 2, fontSize: 12, color: "#555", lineHeight: 16 },
  alertActions: { marginTop: 8, flexDirection: "row", gap: 8 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" },
  smallBtnText: { fontSize: 12, fontWeight: "900", color: "#111" },

  modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#eee" },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  inputWrap: {
    marginTop: 12, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#eee",
    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12,
  },
  input: { flex: 1, fontSize: 14, color: "#111" },
  modalActions: { marginTop: 12, flexDirection: "row", gap: 10, justifyContent: "flex-end" },
});