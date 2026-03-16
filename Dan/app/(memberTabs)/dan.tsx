import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function MemberDanMobileScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'DAN' }} />
      <View style={styles.container}>
        <Text style={styles.title}>DAN</Text>
        <Text style={styles.text}>
          La versión en tiempo real está disponible en web por ahora.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  text: { textAlign: 'center', color: '#444', lineHeight: 20 },
});
