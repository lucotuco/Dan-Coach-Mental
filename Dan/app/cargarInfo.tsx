import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import MedioLogo from '@/components/MedioLogo';
import { Text, useThemeColor } from '@/components/Themed';
import { useAuth } from '@/components/AuthContext';
import { getStoredToken, isUnauthorizedStatus, redirectToLogin } from '@/components/AuthContext';
const sports = [
  'Fútbol',
  'Básquet',
  'Tenis',
  'Pádel',
  'Hockey',
  'Rugby',
  'Vóley',
  'Handball',
  'Natación',
  'Running',
  'Ciclismo',
  'Triatlón',
  'Atletismo',
  'CrossFit',
  'Boxeo',
  'Artes marciales',
  'Gimnasia artística',
  'Esgrima',
  'Surf',
  'Ski / Snowboard',
];

const levels = [
  'principiante',
  'Intemedio',
  'Profesional'
];  

const competitionStyles = [
  'Individual',
  'En pareja',
  'En equipo'
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

export default function ProfileScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sport, setSport] = useState('');
  const { login, user, logout } = useAuth();
  const [level, setLevel] = useState('');
  const [competitionStyle, setCompetitionStyle] = useState('');
  const webDateInputRef = useRef<HTMLInputElement | null>(null);

  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#0b1026' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#141b33' }, 'background');
  const textColor = useThemeColor({ light: '#031355', dark: '#e5e9ff' }, 'tint');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const inputTextColor = useThemeColor({ light: '#1f2937', dark: '#f0f4ff' }, 'text');

  
  const formattedBirthDate = birthDate?.toLocaleDateString('es-ES');

  const toggleDatePicker = () => setShowDatePicker((prev) => !prev);
  const handleDatePress = () => {
    if (Platform.OS === 'web') {
      const node = webDateInputRef.current;
      node?.showPicker?.();
      node?.focus();
      return;
    }

    toggleDatePicker();
  };
  const handleContinue = async () => {
  if (!birthDate || !sport || !level || !competitionStyle) {
    alert('Completa tus datos. Por favor, llena todos los campos para continuar.');
    return;
  }

  try {
    if (!user?._id) {
      throw new Error('No se encontró el usuario (owner).');
    }

    const payload = {
      id: user._id,
      sport,
      level,
      competitionStyle,
      birthDate: birthDate.toISOString(),
    };

    const token = getStoredToken();

    if (!token) {
      redirectToLogin(router, logout);
      return;
    }

    const response = await fetch(API_URL + '/api/users/cargarInfo', {
      method: 'POST', // podés usar PUT si querés, pero que coincida con tu ruta
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (isUnauthorizedStatus(response.status)) {
      redirectToLogin(router, logout);
      return;
    }

    if (!response.ok) {
      console.log('Error desde el backend:', data);
      alert('Error: ' + (data.message ?? 'Ocurrió un error actualizando el usuario'));
      return;
    }

    console.log('Usuario actualizado OK:', data);
    // el backend (ver abajo) va a devolver { message, user }
    login(data.user ?? data);
    router.replace('/(tabs)/homePage');
  } catch (error) {
    console.error('Error al actualizar el usuario (fetch):', error);
    alert('Error de conexión con el servidor');
  }
};

  
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor }]}
      behavior={Platform.OS === 'ios'||'android' ? 'padding' : undefined}
      
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.container}
        style={{ backgroundColor }}
      >
        <View style={styles.logoWrapper}>
          <MedioLogo />
        </View>

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Ingresa tus datos</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>Queremos conocerte mejor para ajustar tu acompañamiento.</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: mutedColor }]}>Fecha de nacimiento</Text>
            <Pressable
              style={[styles.input, styles.selectTrigger, { borderColor: mutedColor }]}
              onPress={handleDatePress}
            >
              <Text
                style={[
                  styles.selectText,
                  { color: formattedBirthDate ? inputTextColor : mutedColor },
                ]}
              >
                {formattedBirthDate ?? 'Elegí tu fecha'}
            </Text>
            <Feather name="calendar" size={18} color={mutedColor} />
            {Platform.OS === 'web' && (
              
              <input
                ref={webDateInputRef}
                type="date"
                  style={styles.hiddenDateInput as any}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value) {
                      const [year, month, day] = value.split('-').map(Number);
                      setBirthDate(new Date(year, month - 1, day));
                    }
                  }}
                />
            )}
                        </Pressable>
          </View>
          {Platform.OS !== 'web' && (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="fade"
              onRequestClose={toggleDatePicker}
            >
              <Pressable style={styles.modalBackdrop} onPress={toggleDatePicker}>
                <Pressable
                  style={[styles.pickerContainer, { backgroundColor: cardColor }]}
                  onPress={() => {}}
                >
                  <DateTimePicker
                    value={birthDate ?? new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                    maximumDate={new Date()}
                    locale="es-ES"
                    onChange={(event, selectedDate) => {
                      if (Platform.OS !== 'ios') {
                        toggleDatePicker();
                      }
                      if (event.type !== 'dismissed' && selectedDate) {
                        setBirthDate(selectedDate);
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: textColor }]}
                      onPress={toggleDatePicker}
                    >
                      <Text style={styles.primaryButtonText}>Listo</Text>
                    </TouchableOpacity>
                  )}
                </Pressable>
              </Pressable>
            </Modal>
          )}
          <View style={styles.selectorGrid}>
          <OptionSelector
            label="Seleccionar deporte"
            value={sport}
            onSelect={setSport}
            options={sports}
          />

          <OptionSelector
            label="Nivel"
            value={level}
            onSelect={setLevel}
            options={levels}
          />

          <OptionSelector
            label="Cómo competís?"
            value={competitionStyle}
            onSelect={setCompetitionStyle}
            options={competitionStyles}
          />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: textColor }]}
            onPress={handleContinue}
          >
            <Text style={styles.primaryButtonText}>CONTINUAR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hiddenDateInput: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
  },
   pickerContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 40,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4d7e2',
    gap: 12,
  },
   optionItem: {
    paddingVertical: 12,
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#eceff5',
  },
  selectorGrid: {
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f1b4c',
    marginBottom: 12,
  },
  selectorValue: {
    fontSize: 15,
    color: '#1f2b6c',
    fontWeight: '600',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '60%',
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
  selectorLabel: {
    fontSize: 14,
    color: '#1f2b6c',
    fontWeight: '600',
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#00000020',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectContainer: {
    position: 'relative',
    zIndex: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  optionList: {
    zIndex: 20,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#00000026',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2b6c',
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },selectorWrapper: {
    gap: 6,
  },
});