import { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet,Image } from 'react-native';
import { useAuth } from '@/components/AuthContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Avatar from '@/components/Avatar';
import DashboardTile from '@/components/DashboardTile';
import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';


type QuickAction = {
  key: string;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof FontAwesome5>['name'];
  accent: string;
  wrapped?: boolean;
};


const quickActions: QuickAction[] = [
  {
    key: '/(tabs)/checkups',
    title: 'Chequeos mentales',
    subtitle: 'Tu estado en minutos',
    icon: 'check-circle',
    accent: '#a5c5ff',
    wrapped: false,
  },
  {
    key: '/(tabs)/sesions',
    title: 'Sesiones',
    subtitle: 'Agenda y seguimiento',
    icon: 'comment-alt',
    accent: '#ffceceff',
    wrapped: false,
  },
  {
    key: '/(tabs)/progress',
    title: 'Progresos',
    subtitle: 'Mide tus avances',
    icon: 'chart-line',
    accent: '#d6f3d2',
    wrapped: false,
  },
  {
    key: '/(tabs)/EntrenamientosPersonales',
    title: 'Entrenamientos personales',
    subtitle: 'Rutinas a tu medida',
    icon: 'dumbbell',
    accent: '#ffeab6',
    wrapped: false,
  },
  {
    key: '/(tabs)/EjerciciosGuiados',
    title: 'Ejercicios guiados',
    subtitle: 'Respiración y relajación',
    icon: 'headphones',
    accent: '#e8d4ffff',
    wrapped: false,
  },
  
  {
    key: '/(tabs)/library',
    title: 'Biblioteca',
    subtitle: 'Recursos y lecturas',
    icon: 'book-open',
    accent: '#fddac2ff',
    wrapped: false,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const primaryColor = useThemeColor({ light: '#031355ff', dark: '#748ffc' }, 'tint');
  const { user, isAuthenticated, logout } = useAuth();
  const username = {name: user?.name,};
  
  /*useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);
*/
  
  const tileRows: QuickAction[][] = [];
  for (let i = 0; i < quickActions.length; i += 2) {
    tileRows.push(quickActions.slice(i, i + 2));
  }

  return (
    
  <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
    >
      <MedioLogo/>
      
      <Link href="/profile">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Buenos días,</Text>
          <Text style={styles.userName}>{username.name}</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>¿Listo para continuar con tu plan?</Text>
        </View>        
        <Avatar name={username.name} size={56} />
      </View>
      </Link>

      <View style={styles.tilesWrapper}>
        <Text style={styles.sectionTitle}>Entrena tu mente, potenciá tu rendimiento</Text>
        <View style={styles.tilesGrid}>
          {tileRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tilesRow}>
              {row.map((action) => (
                <View key={action.key} style={styles.tileCell}>
                  <DashboardTile
                    icon={action.icon}
                    title={action.title}
                    subtitle={action.subtitle}
                    accentColor={action.accent}
                    wrapped={action.wrapped}
                    onPress={() => router.navigate(action.key)}
                  />
                </View>
              ))}
              {row.length === 1 ? <View style={[styles.tileCell, styles.placeholderCell]} /> : null}
            </View>
            
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  espacio: {
    marginTop: 30,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  dailyCheckCard: {
    gap: 20,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaCard: {
    padding: 20,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  ctaText: {
    flex: 1,
    gap: 4,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  ctaButton: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tilesWrapper: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  tilesGrid: {
    gap: 16,
  },
  tilesRow: {
    flexDirection: 'row',
    columnGap: 16,
    rowGap: 16,
  },
  tileCell: {
    flex: 1,
  },
  placeholderCell: {
    opacity: 0,
  },
});
