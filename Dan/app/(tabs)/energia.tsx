import { StyleSheet,ScrollView } from 'react-native';

import { Text, View } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

export default function LibraryScreenEnergia() {
  return (
    <ScrollView style={{backgroundColor:'#fff'}} >
      <View style={styles.container}>
      <MedioLogo/>
      <Text style={styles.title}>Movilida suave para recargar energía</Text>
     </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
