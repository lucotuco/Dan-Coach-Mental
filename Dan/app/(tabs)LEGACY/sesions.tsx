// app/(tabs)/sesions.tsx  (o tu ruta real)
// Implementa la opción (6): “Beneficios claros” + “Qué vas a lograr hoy” para la vista Virtual.
// Además: en Coach real queda UN SOLO selector de fecha (sin CTA duplicado).
//
// Web datepicker: react-datepicker + CSS
// Mobile (opcional): @react-native-community/datetimepicker (solo si vas a compilar mobile)
//
// Instalar:
//   npm i react-datepicker
//   (opcional) npx expo install @react-native-community/datetimepicker
//
// Nota: si usás expo-router, podés habilitar navegación descomentando useRouter.

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  SafeAreaView,
  ScrollView,
} from "react-native";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter} from 'expo-router';
import MedioLogo from "@/components/MedioLogo";
type Mode = "virtual" | "coach";

const TIME_SLOTS = ["08:00", "09:30", "11:00", "14:00", "15:30", "18:30", "20:00"];

export default function SessionsScreen() {
  // const router = useRouter();

  const [mode, setMode] = useState<Mode>("virtual");

  // Coach booking
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Date modal
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const prettyDate = useMemo(() => formatPrettyDate(selectedDate), [selectedDate]);
  const canBook = Boolean(selectedTime);

  const priceLabel = "USD 50";
  const router = useRouter();
  const onStartVirtual = () => {
    router.push('/(tabs)/coachVirtual');
  };

  const onBookCoach = () => {
    if (!canBook) return;
    console.log("Book coach session:", { date: selectedDate, time: selectedTime });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[{marginTop: 8}]}>
        <MedioLogo />
        </View> 
        <Text style={styles.title}>Sesiones</Text>
        <Text style={styles.subtitle}>Elegí cómo querés entrenar tu mente hoy.</Text>

        <Segmented value={mode} onChange={setMode} />

        {mode === "virtual" ? (
          <View style={{ gap: 12 }}>
            <Card
              tone="blue"
              title="DAN (Virtual) — ahora"
              description="Conversación en tiempo real • Disponible 24/7"
              bullets={["Respuesta inmediata", "Ejercicios guiados", "Sin turnos"]}
              badge="Gratis"
            />

            
            <OutcomePanel
              onStart={onStartVirtual}
              title="Qué vas a lograr hoy"
              subtitle="Una sesión corta para bajar el ruido mental y salir con un foco claro."
              outcomes={[
                { title: "Bajar revoluciones", desc: "Volver a un estado más calmo y estable." },
                { title: "Definir un foco", desc: "Elegir una sola prioridad para el próximo paso." },
                { title: "Plan corto", desc: "Salir con una acción simple para hoy." },
              ]}
              footer="Dura lo que necesites. Podés cortar y volver cuando quieras."
              primaryLabel="Empezar ahora"
              
              onSecondary={() => {
                // Podés abrir un modal de ayuda o navegar a /help
                console.log("Open how it works");
              }}
            />

            {/* Mini bloque opcional: reduce dudas sin agregar fricción */}
            <InfoStrip
              items={[
                { k: "Tiempo", v: "2–10 min" },
                { k: "Disponibilidad", v: "24/7" },
                { k: "Formato", v: "Voz o texto" },
              ]}
            />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Card
              tone="sand"
              title="Coach Personal (1:1)"
              description="Sesión + análisis personalizado"
              bullets={["Turno programado", "Seguimiento y enfoque a objetivos", "Espacio 1:1"]}
              badge={priceLabel}
            />

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Elegí fecha y horario</Text>

              {/* ✅ Único disparador de elegir fecha */}
              <Pressable
                onPress={() => setDateModalOpen(true)}
                style={({ pressed }) => [styles.inputLike, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Elegir fecha"
              >
                <Text style={styles.inputText}>{prettyDate}</Text>
                <Text style={styles.inputHint}>Cambiar</Text>
              </Pressable>

              <Text style={[styles.panelTitle, { marginTop: 12 }]}>Horarios disponibles</Text>

              <View style={styles.chipsWrap}>
                {TIME_SLOTS.map((t) => {
                  const active = t === selectedTime;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setSelectedTime(t)}
                      style={({ pressed }) => [
                        styles.chip,
                        active && styles.chipActive,
                        pressed && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Seleccionar horario ${t}`}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Tu sesión</Text>
                <Row label="Tipo" value="Coach real (1:1)" />
                <Row label="Fecha" value={prettyDate} />
                <Row label="Hora" value={selectedTime ? `${selectedTime} hs` : "—"} />
                <Row label="Precio" value={priceLabel} />
              </View>

              <Pressable
                onPress={onBookCoach}
                disabled={!canBook}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canBook && styles.primaryButtonDisabled,
                  pressed && canBook && styles.primaryButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canBook }}
                accessibilityLabel="Agendar sesión con un coach"
              >
                <Text style={styles.primaryButtonText}>
                  {canBook ? "Agendar sesión" : "Elegí un horario"}
                </Text>
              </Pressable>

              <Text style={styles.smallNote}>
                Podés reprogramar si cambia tu agenda (según disponibilidad).
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Date Picker Modal (WEB + MOBILE) */}
      <Modal
        visible={dateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDateModalOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setDateModalOpen(false)} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Elegí una fecha</Text>

          <CrossPlatformDatePicker
            value={selectedDate}
            onChange={(d) => {
              setSelectedDate(d);
              setSelectedTime(null);
              if (Platform.OS === "android") setDateModalOpen(false);
            }}
          />

          <View style={styles.modalActions}>
            <Pressable
              onPress={() => setDateModalOpen(false)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Confirmar fecha"
            >
              <Text style={styles.secondaryButtonText}>Listo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ----------------------------- Components ----------------------------- */

function OutcomePanel({
  title,
  subtitle,
  outcomes,
  footer,
  primaryLabel,
  
  onStart,
  onSecondary,
}: {
  title: string;
  subtitle: string;
  outcomes: { title: string; desc: string }[];
  footer?: string;
  primaryLabel: string;
  
  onStart: () => void;
  onSecondary?: () => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      <Text style={styles.panelHint}>{subtitle}</Text>

      <View style={{ marginTop: 12, gap: 10 }}>
        {outcomes.map((o) => (
          <View key={o.title} style={styles.outcomeRow}>
            <View style={styles.outcomeDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.outcomeTitle}>{o.title}</Text>
              <Text style={styles.outcomeDesc}>{o.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {footer ? <Text style={styles.smallNote}>{footer}</Text> : null}

      <View style={styles.actionsRow}>


        <Pressable
          onPress={onStart}
          style={({ pressed }) => [styles.primaryButtonInline, pressed && styles.primaryButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
        >
          <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoStrip({ items }: { items: { k: string; v: string }[] }) {
  return (
    <View style={styles.strip}>
      {items.map((it) => (
        <View key={it.k} style={styles.stripItem}>
          <Text style={styles.stripKey}>{it.k}</Text>
          <Text style={styles.stripVal}>{it.v}</Text>
        </View>
      ))}
    </View>
  );
}

function CrossPlatformDatePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  if (Platform.OS === "web") {
    return (
      <View style={styles.webDatepickerWrap}>
        <DatePicker
          selected={value}
          onChange={(d: Date | null) => d && onChange(d)}
          minDate={new Date()}
          inline
        />
      </View>
    );
  }

  // MOBILE (require dinámico para no romper web)
  const RNDateTimePicker = require("@react-native-community/datetimepicker").default;

  return (
    <RNDateTimePicker
      value={value}
      mode="date"
      display={Platform.OS === "ios" ? "inline" : "calendar"}
      onChange={(_: any, d?: Date) => d && onChange(d)}
      minimumDate={new Date()}
    />
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.brand}>DAN</Text>
      <Text style={styles.brandSub}>COACH MENTAL DEPORTIVO</Text>
    </View>
  );
}

function Segmented({ value, onChange }: { value: Mode; onChange: (v: Mode) => void }) {
  return (
    <View style={styles.segmented}>
      <Pressable
        onPress={() => onChange("virtual")}
        style={({ pressed }) => [
          styles.segment,
          value === "virtual" && styles.segmentActive,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: value === "virtual" }}
      >
        <Text style={[styles.segmentText, value === "virtual" && styles.segmentTextActive]}>
          Virtual (ahora)
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("coach")}
        style={({ pressed }) => [
          styles.segment,
          value === "coach" && styles.segmentActive,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: value === "coach" }}
      >
        <Text style={[styles.segmentText, value === "coach" && styles.segmentTextActive]}>
          Coach real (turno)
        </Text>
      </Pressable>
    </View>
  );
}

function Card({
  tone,
  title,
  description,
  bullets,
  badge,
}: {
  tone: "blue" | "sand";
  title: string;
  description: string;
  bullets: string[];
  badge?: string;
}) {
  const toneStyle = tone === "blue" ? styles.cardBlue : styles.cardSand;

  return (
    <View style={[styles.card, toneStyle]}>
      <View style={{ gap: 8 }}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{title}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>

        <Text style={styles.cardDesc}>{description}</Text>

        <View style={{ gap: 6, marginTop: 4 }}>
          {bullets.map((b) => (
            <Text key={b} style={styles.bullet}>
              • {b}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/* ----------------------------- Helpers ----------------------------- */

function formatPrettyDate(d: Date) {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const day = d.getDate().toString().padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/* ----------------------------- Styles ----------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { padding: 16, gap: 12 },

  header: { alignItems: "center", marginBottom: 4 },
  brand: { fontSize: 34, fontWeight: "900", letterSpacing: 1.5, color: "#C62828" },
  brandSub: { fontSize: 12, fontWeight: "700", color: "#1B2A57", marginTop: 2 },

  title: { fontSize: 26, fontWeight: "900", color: "#0B1020" },
  subtitle: { fontSize: 14, color: "#3B4666", marginTop: -6 },

  segmented: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    backgroundColor: "#F1F4FF",
    gap: 6,
    marginTop: 6,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: { backgroundColor: "#0F1E4D" },
  segmentText: { fontWeight: "800", color: "#0F1E4D" },
  segmentTextActive: { color: "#FFFFFF" },

  card: { borderRadius: 18, padding: 16 },
  cardBlue: { backgroundColor: "#DCE8FF" },
  cardSand: { backgroundColor: "#F7EEDB" },

  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontSize: 18, fontWeight: "900", color: "#0B1020", flex: 1 },
  badge: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F1E4D",
    backgroundColor: "rgba(255,255,255,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cardDesc: { fontSize: 13, color: "#28304A" },
  bullet: { fontSize: 13, color: "#28304A" },

  panel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F8",
  },
  panelTitle: { fontSize: 14, fontWeight: "900", color: "#0B1020", marginBottom: 6 },
  panelHint: { fontSize: 12, color: "#64709A", fontWeight: "700" },

  outcomeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 2,
  },
  outcomeDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#0F1E4D",
    marginTop: 6,
  },
  outcomeTitle: { fontSize: 13, fontWeight: "900", color: "#0B1020" },
  outcomeDesc: { fontSize: 12, color: "#3B4666", fontWeight: "700", marginTop: 2 },

  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },

  ghostButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F6F7FB",
    borderWidth: 1,
    borderColor: "#E6E9F5",
  },
  ghostButtonText: { fontWeight: "900", color: "#0F1E4D" },

  primaryButtonInline: {
    flex: 1,
    backgroundColor: "#0F1E4D",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  inputLike: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F6F7FB",
    borderWidth: 1,
    borderColor: "#E6E9F5",
  },
  inputText: { fontSize: 14, fontWeight: "800", color: "#0B1020" },
  inputHint: { fontSize: 12, fontWeight: "800", color: "#0F1E4D" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F6F7FB",
    borderWidth: 1,
    borderColor: "#E6E9F5",
  },
  chipActive: { backgroundColor: "#0F1E4D", borderColor: "#0F1E4D" },
  chipText: { fontWeight: "900", color: "#0F1E4D" },
  chipTextActive: { color: "#FFFFFF" },

  summary: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#F8FAFF",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E8EDFF",
    gap: 6,
  },
  summaryTitle: { fontWeight: "900", color: "#0B1020", marginBottom: 4 },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowLabel: { color: "#3B4666", fontWeight: "800" },
  rowValue: { color: "#0B1020", fontWeight: "900" },

  primaryButton: {
    marginTop: 14,
    backgroundColor: "#0F1E4D",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonPressed: { transform: [{ scale: 0.99 }] },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },

  smallNote: { marginTop: 10, fontSize: 12, color: "#64709A", fontWeight: "700" },

  strip: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#E8EDFF",
    padding: 12,
    borderRadius: 16,
  },
  stripItem: { flex: 1 },
  stripKey: { fontSize: 11, color: "#64709A", fontWeight: "900" },
  stripVal: { fontSize: 12, color: "#0B1020", fontWeight: "900", marginTop: 2 },

  pressed: { opacity: 0.92 },

  // Modal
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  modalCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F8",
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0B1020", marginBottom: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },

  secondaryButton: {
    backgroundColor: "#F1F4FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: { fontWeight: "900", color: "#0F1E4D" },

  webDatepickerWrap: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF0F8",
  },
});
