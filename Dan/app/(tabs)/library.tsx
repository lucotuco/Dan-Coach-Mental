import { StyleSheet,ScrollView } from 'react-native';

import { Text, View } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

export default function LibraryScreen() {
  return (
    <ScrollView style={{backgroundColor:'#fff'}} >
      <View style={styles.container}>
          <MedioLogo/>
      <Text style={styles.title}>Biblioteca</Text>
      <Text style={styles.subtitle}>
        Reúne recursos, artículos y ejercicios en esta biblioteca muy pronto.
      </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    opacity: 0.7,
  },
});
