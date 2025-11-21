import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/Themed';
import RecordingButton from '@/components/AudioRecorderButton';

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const hours = [
  '08:00 AM',
  '09:30 AM',
  '11:00 AM',
  '01:00 PM',
  '03:00 PM',
  '05:30 PM',
  '07:00 PM',
];

type SelectorProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
};

const OptionSelector = ({ label, value, options, onSelect }: SelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.selectorWrapper}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.selector,
          pressed && { opacity: 0.9 },
        ]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.selectorValue}>{value}</Text>
        <Feather name="chevron-down" size={18} color="#1f2b6c" />
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.optionDivider} />}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default function SessionsScreen() {
  const currentDay = useMemo(() => new Date().getDate().toString(), []);
  const currentMonth = useMemo(() => months[new Date().getMonth()], []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [selectedHour, setSelectedHour] = useState(hours[0]);

  const days = useMemo(
    () => Array.from({ length: 31 }, (_, index) => (index + 1).toString()),
    [],
  );

  const handleStartSession = () => {
    Alert.alert(
      'Esta funcion todavia esta en desrrollo',
      'Gracias x confiar en Dan Coach Mental',
    );
  };

  const handleReserveCoach = () => {
    Alert.alert(
      'Esta funcion todavia esta en desrrollo',
      'Gracias x confiar en Dan Coach Mental',
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content,{backgroundColor:"#fff"}]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container }>
        <Text style={styles.title}>Sesiones</Text>
        <Text style={styles.description}>
          Accede a sesiones guiadas con Coach DAN o agenda tu próximo encuentro con un coach personal.
        </Text>

        <View style={[styles.card, styles.danCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sesión con el Coach DAN</Text>
            <Text style={styles.cardSubtitle}>Gratis, 360 días/año</Text>
          </View>
          <Text style={styles.cardText}>
            Entrena en cualquier momento con Dan. Entra y charla en tiempo real con tu coach mental.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
            onPress={handleStartSession}
          >
            <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.personalCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sesión con un Coach Personal</Text>
            <Text style={styles.cardSubtitle}>Sesiones y análisis personalizados</Text>
          </View>

          <View style={styles.selectorGrid}>
            <OptionSelector
              label="Mes"
              value={selectedMonth}
              options={months}
              onSelect={setSelectedMonth}
            />
            <OptionSelector
              label="Día"
              value={selectedDay}
              options={days}
              onSelect={setSelectedDay}
            />
            <OptionSelector
              label="Hora"
              value={selectedHour}
              options={hours}
              onSelect={setSelectedHour}
            />
          </View>

          <Text style={styles.rateText}>$50 USD convertidos a moneda local</Text>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.9 },
            ]}
            onPress={handleReserveCoach}
          >
            <Text style={styles.secondaryButtonText}>Reservar</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  container: {
    flex: 1,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2b6c',
  },
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 14,
  },
  danCard: {
    backgroundColor: '#dce9ff',
  },
  personalCard: {
    backgroundColor: '#fdf3e2',
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f1b4c',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#1f2b6c',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1f2b6c',
  },
  primaryButton: {
    backgroundColor: '#0f1b4c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  selectorGrid: {
    gap: 12,
  },
  selectorWrapper: {
    gap: 6,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#1f2b6c',
    fontWeight: '600',
  },
  selector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d6d9e6',
  },
  selectorValue: {
    fontSize: 15,
    color: '#1f2b6c',
    fontWeight: '600',
  },
  rateText: {
    fontSize: 14,
    color: '#1f2b6c',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#0f1b4c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  recorderCard: {
    backgroundColor: '#eef0f8',
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  recorderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f1b4c',
  },
  recorderText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1f2b6c',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f1b4c',
    marginBottom: 12,
  },
  optionItem: {
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 15,
    color: '#1f2b6c',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#eceff5',
  },
});