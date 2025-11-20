import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import MedioLogo from '@/components/MedioLogo';
import { Text, useThemeColor } from '@/components/Themed';

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onSelect: (value: string) => void;
  options: SelectOption[];
  cardColor: string;
  mutedColor: string;
  inputTextColor: string;
};

function SelectField({
  label,
  placeholder,
  value,
  onSelect,
  options,
  cardColor,
  mutedColor,
  inputTextColor,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [dropdownLayout, setDropdownLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const selectedLabel = options.find((option) => option.value === value)?.label;

  const handleToggle = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout({ x, y, width, height });
      setOpen((prev) => !prev);
    });
  };

  return (
    <View style={[styles.inputGroup, styles.selectContainer]}>
      <Text style={[styles.label, { color: mutedColor }]}>{label}</Text>
      <View>
        <Pressable
          ref={triggerRef}
          onPress={handleToggle}
          style={[styles.input, styles.selectTrigger, { borderColor: mutedColor }]}
        >
          <Text
            style={[
              styles.selectText,
              { color: selectedLabel ? inputTextColor : mutedColor },
            ]}
          >
            {selectedLabel ?? placeholder}
          </Text>
          <Feather
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={mutedColor}
          />
        </Pressable>
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
            <Pressable
              style={{
                position: 'absolute',
                top: dropdownLayout.y + dropdownLayout.height + 6,
                left: dropdownLayout.x,
                width: dropdownLayout.width,
              }}
              onPress={() => {}}
            >
              <View
                style={[
                  styles.optionList,
                  { backgroundColor: cardColor, borderColor: mutedColor },
                ]}
              >
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onSelect(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && { backgroundColor: '#f3f2f6' },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: inputTextColor }]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [age, setAge] = useState('');
  const [sport, setSport] = useState('');
  const [level, setLevel] = useState('');
  const [competitionStyle, setCompetitionStyle] = useState('');

  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#0b1026' }, 'background');
  const cardColor = useThemeColor({ light: '#ffffff', dark: '#141b33' }, 'background');
  const textColor = useThemeColor({ light: '#031355', dark: '#e5e9ff' }, 'tint');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const inputTextColor = useThemeColor({ light: '#1f2937', dark: '#f0f4ff' }, 'text');

  const sports: SelectOption[] = [
    { label: 'Atletismo', value: 'atletismo' },
    { label: 'Básquet', value: 'basquet' },
    { label: 'Ciclismo', value: 'ciclismo' },
    { label: 'Fútbol', value: 'futbol' },
    { label: 'Natación', value: 'natacion' },
    { label: 'Tenis', value: 'tenis' },
    { label: 'Triatlón', value: 'triatlon' },
    { label: 'Vóley', value: 'voley' },
  ];

  const levels: SelectOption[] = [
    { label: 'Inicial', value: 'inicial' },
    { label: 'Intermedio', value: 'intermedio' },
    { label: 'Avanzado', value: 'avanzado' },
    { label: 'Profesional', value: 'profesional' },
  ];

  const competitionStyles: SelectOption[] = [
    { label: 'Individual', value: 'individual' },
    { label: 'Equipo', value: 'equipo' },
    { label: 'Mixto', value: 'mixto' },
  ];

  const handleContinue = () => {
    if (!age || !sport || !level || !competitionStyle) {
      alert('Completa tus datos Por favor, llena todos los campos para continuar.');
      return;
    }
    router.replace('/(tabs)/homePage')
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
            <Text style={[styles.label, { color: mutedColor }]}>Edad</Text>
            <TextInput
              style={[styles.input, { borderColor: mutedColor, color: inputTextColor }]}
              placeholder="Ej: 23"
              placeholderTextColor={mutedColor}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>

          <SelectField
            label="Seleccionar deporte"
            placeholder="Elegí tu deporte"
            value={sport}
            onSelect={setSport}
            options={sports}
            cardColor={cardColor}
            mutedColor={mutedColor}
            inputTextColor={inputTextColor}
          />

          <SelectField
            label="Nivel"
            placeholder="Seleccioná tu nivel"
            value={level}
            onSelect={setLevel}
            options={levels}
            cardColor={cardColor}
            mutedColor={mutedColor}
            inputTextColor={inputTextColor}
          />

          <SelectField
            label="Cómo competís?"
            placeholder="Individual o en equipo"
            value={competitionStyle}
            onSelect={setCompetitionStyle}
            options={competitionStyles}
            cardColor={cardColor}
            mutedColor={mutedColor}
            inputTextColor={inputTextColor}
          />

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
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
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
  },
});