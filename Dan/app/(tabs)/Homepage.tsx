import type { ComponentProps, ImageSourcePropType } from 'react';
import { Link, useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/components/AuthContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Avatar from '@/components/Avatar';
import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

type HomeTile = {
  key: string;
  title: string;
  subtitle?: string;
  icon?: ComponentProps<typeof FontAwesome5>['name'];
  accent: string;
  route: string;
  doubleHeight?: boolean;
  image?: ImageSourcePropType;
};

const tiles: HomeTile[] = [
  {
    key: 'checkups',
    title: 'Chequeos',
    subtitle: 'Chequeos mentales',
    icon: 'check-circle',
    accent: '#e7efff',
    route: '/(tabs)/checkups',
  },
  {
    key: 'progress',
    title: 'Progreso',
    subtitle: 'Seguimiento y métricas',
    icon: 'chart-line',
    accent: '#ffe9bd',
    route: '/(tabs)/progress',
  },
  {
    key: 'sessions',
    title: 'Sesiones',
    subtitle: 'Agenda y seguimiento',
    icon: 'comment-alt',
    accent: '#e7e6ef',
    route: '/(tabs)/sesions',
  },
  {
    key: 'guided',
    title: 'Ejercicios guiados',
    subtitle: 'Respiración y relajación',
    icon: 'headphones',
    accent: '#d9f4d7',
    route: '/(tabs)/ejerciciosGuiados',
  },
  {
    key: 'library',
    title: 'Biblioteca',
    subtitle: 'Recursos y lecturas',
    icon: 'book-open',
    accent: '#e5f3ff',
    route: '/(tabs)/library',
  },
  {
    key: 'teens',
    title: 'Dan Teens',
    subtitle: 'Entrena como un pro',
    icon: 'user-friends',
    accent: '#dfe6ff',
    route: '/(tabs)/danTeens',
  },
  {
    key: 'kids',
    title: 'Dan Kids',
    subtitle: 'Diversión asegurada',
    icon: 'child',
    accent: '#d7f8ff',
    route: '/(tabs)/danKids',
  },
  {
    key: 'coach',
    title: 'Hablar con tu coach',
    subtitle: 'Chateá al instante',
    accent: '#fbd9c8',
    route: '/(tabs)/coachVirtual',
    doubleHeight: true,
    image: require('@/assets/images/Dan-Image2.jpg'),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const { user } = useAuth();

  // 🔹 Si no hay user, podés redirigir a bienvenida o mostrar algo básico
  // (opcional)
  // if (!user) {
  //   router.replace('/bienvenida');
  //   return null;
  // }

  const displayName = user?.name ?? 'Deportista';
  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      scrollEnabled={true}
      showsVerticalScrollIndicator={false}
    >
      <MedioLogo />

      <Link href="/profile">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Buenos días,</Text>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={[styles.subtitle, { color: mutedColor }]}>
              ¿Listo para continuar con tu plan?
            </Text>
          </View>
          <Avatar name={displayName} size={56} />
        </View>
      </Link>

      <View style={styles.tilesWrapper}>
        <Text style={styles.sectionTitle}>Entrena tu mente, potenciá tu rendimiento</Text>
        <View style={styles.tilesGrid}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={[
                styles.tile,
                { backgroundColor: tile.accent },
                tile.doubleHeight && styles.doubleHeightTile,
              ]}
              onPress={() => router.navigate(tile.route)}
            >
              {tile.image ? (
                <Image source={tile.image} style={styles.coachImage} resizeMode="cover" />
              ) : (
                <View style={styles.iconWrap}>
                  {tile.icon ? <FontAwesome5 name={tile.icon} size={26} color="#0b1a3a" /> : null}
                </View>
              )}
              <Text style={styles.tileTitle}>{tile.title}</Text>
              {tile.subtitle ? (
                <Text style={[styles.tileSubtitle, { color: mutedColor }]}>{tile.subtitle}</Text>
              ) : null}
            </TouchableOpacity>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  tile: {
    borderRadius: 18,
    padding: 14,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '32%',
    aspectRatio: 1,
    shadowColor: '#00000015',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  doubleHeightTile: {
    aspectRatio: 0.55,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  coachImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 0.9,
    borderRadius: 16,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  tileSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
