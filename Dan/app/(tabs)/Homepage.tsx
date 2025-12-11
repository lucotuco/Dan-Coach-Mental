import type { ComponentProps } from 'react';
import { Link, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, type ImageSourcePropType } from 'react-native';
import { useAuth } from '@/components/AuthContext';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Avatar from '@/components/Avatar';
import DashboardTile from '@/components/DashboardTile';
import { Text, View, useThemeColor } from '@/components/Themed';
import MedioLogo from '@/components/MedioLogo';

// 👉 imagen para el tile de Sesiones
const danSessionsImage: ImageSourcePropType = require('@/assets/images/Dan-Image2.jpg');

type QuickAction = {
  key: string;
  title: string;
  icon: ComponentProps<typeof FontAwesome5>['name'];
  accent: string;
  tall?: boolean;
  tallSide?: 'left' | 'right';
  imageSource?: ImageSourcePropType;
  hideText?: boolean;
};

const quickActions: QuickAction[] = [
  // BLOQUE ALTO: Chequeos (arriba izq) + Progreso (abajo izq) + Sesiones (doble alto con imagen)
  {
    key: '/(tabs)/checkups',
    title: 'Chequeos',
    icon: 'check-circle',
    accent: '#dfefff',
  },
  {
    key: '/(tabs)/progress',
    title: 'Progreso',
    icon: 'chart-line',
    accent: '#fff4c3',
  },
  {
    key: '/(tabs)/coachVirtual',
    title: 'Sesiones',
    icon: 'comment-alt', // solo para el tipo, no se muestra
    accent: '#ffd8c8',
    tall: true,
    tallSide: 'right',
    imageSource: danSessionsImage,
    hideText: true, // 👉 solo imagen, sin título
  },

  // FILA: Ejercicios / Biblioteca
  {
    key: '/(tabs)/ejerciciosGuiados',
    title: 'Ejercicios guiados',
    icon: 'headphones',
    accent: '#e5f5cf',
  },
  {
    key: '/(tabs)/library',
    title: 'Biblioteca',
    icon: 'book-open',
    accent: '#e4e4e4',
  },

  // FILA: DAN TEENS / DAN KIDS
  {
    key: '/(tabs)/danTeens',
    title: 'DAN TEENS',
    icon: 'user-friends',
    accent: '#f9ddff',
  },
  {
    key: '/(tabs)/danKids',
    title: 'DAN KIDS',
    icon: 'child',
    accent: '#cde7ff',
  },
];

type TileRow =
  | { type: 'pair'; left: QuickAction; right?: QuickAction }
  | { type: 'tallRight'; leftTop: QuickAction; leftBottom: QuickAction; rightTall: QuickAction }
  | { type: 'tallLeft'; rightTop: QuickAction; rightBottom: QuickAction; leftTall: QuickAction };

function buildTileRows(actions: QuickAction[]): TileRow[] {
  const rows: TileRow[] = [];
  let i = 0;

  while (i < actions.length) {
    const current = actions[i];
    const next = actions[i + 1];
    const third = actions[i + 2];

    // bloque: normal + normal + tallRight
    if (
      current &&
      next &&
      third &&
      third.tall &&
      third.tallSide === 'right'
    ) {
      rows.push({
        type: 'tallRight',
        leftTop: current,
        leftBottom: next,
        rightTall: third,
      });
      i += 3;
      continue;
    }

    // bloque: tallLeft + normal + normal (por si lo usás más adelante)
    if (
      current &&
      current.tall &&
      current.tallSide === 'left' &&
      next &&
      third
    ) {
      rows.push({
        type: 'tallLeft',
        leftTall: current,
        rightTop: next,
        rightBottom: third,
      });
      i += 3;
      continue;
    }

    // fila normal con dos tiles
    if (next) {
      rows.push({ type: 'pair', left: current, right: next });
      i += 2;
      continue;
    }

    // última sola
    rows.push({ type: 'pair', left: current });
    i += 1;
  }

  return rows;
}

export default function HomeScreen() {
  const router = useRouter();
  const backgroundColor = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const mutedColor = useThemeColor({ light: '#6c728a', dark: '#a6aac4' }, 'text');
  const { user } = useAuth();

  const displayName = user?.name ?? 'Deportista';
  const tileRows = buildTileRows(quickActions);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      scrollEnabled
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
          {tileRows.map((row, rowIndex) => {
            // bloque: alta a la derecha
            if (row.type === 'tallRight') {
              const { leftTop, leftBottom, rightTall } = row;
              return (
                <View key={rowIndex} style={styles.tallRow}>
                  {/* columna izquierda con 2 tiles apiladas */}
                  <View style={styles.stackColumn}>
                    <View style={[styles.tileCell, styles.stackItem, styles.stackItemTop]}>
                      <DashboardTile
                        icon={leftTop.icon}
                        title={leftTop.title}
                        accentColor={leftTop.accent}
                        imageSource={leftTop.imageSource}
                        hideText={leftTop.hideText}
                        onPress={() => router.navigate(leftTop.key)}
                      />
                    </View>
                    <View style={[styles.tileCell, styles.stackItem]}>
                      <DashboardTile
                        icon={leftBottom.icon}
                        title={leftBottom.title}
                        accentColor={leftBottom.accent}
                        imageSource={leftBottom.imageSource}
                        hideText={leftBottom.hideText}
                        onPress={() => router.navigate(leftBottom.key)}
                      />
                    </View>
                  </View>

                  {/* columna derecha: tile alta */}
                  <View style={[styles.tileCell, styles.tallCell]}>
                    <DashboardTile
                      icon={rightTall.icon}
                      title={rightTall.title}
                      accentColor={rightTall.accent}
                      imageSource={rightTall.imageSource}
                      hideText={rightTall.hideText}
                      onPress={() => router.navigate(rightTall.key)}
                    />
                  </View>
                </View>
              );
            }

            // bloque: alta a la izquierda (por si luego lo usás)
            if (row.type === 'tallLeft') {
              const { leftTall, rightTop, rightBottom } = row;
              return (
                <View key={rowIndex} style={styles.tallRow}>
                  <View style={[styles.tileCell, styles.tallCell]}>
                    <DashboardTile
                      icon={leftTall.icon}
                      title={leftTall.title}
                      accentColor={leftTall.accent}
                      imageSource={leftTall.imageSource}
                      hideText={leftTall.hideText}
                      onPress={() => router.navigate(leftTall.key)}
                    />
                  </View>

                  <View style={styles.stackColumn}>
                    <View style={[styles.tileCell, styles.stackItem, styles.stackItemTop]}>
                      <DashboardTile
                        icon={rightTop.icon}
                        title={rightTop.title}
                        accentColor={rightTop.accent}
                        imageSource={rightTop.imageSource}
                        hideText={rightTop.hideText}
                        onPress={() => router.navigate(rightTop.key)}
                      />
                    </View>
                    <View style={[styles.tileCell, styles.stackItem]}>
                      <DashboardTile
                        icon={rightBottom.icon}
                        title={rightBottom.title}
                        accentColor={rightBottom.accent}
                        imageSource={rightBottom.imageSource}
                        hideText={rightBottom.hideText}
                        onPress={() => router.navigate(rightBottom.key)}
                      />
                    </View>
                  </View>
                </View>
              );
            }

            // fila normal
            if (row.type === 'pair') {
              return (
                <View key={rowIndex} style={styles.row}>
                  <View style={styles.tileCell}>
                    <DashboardTile
                      icon={row.left.icon}
                      title={row.left.title}
                      accentColor={row.left.accent}
                      imageSource={row.left.imageSource}
                      hideText={row.left.hideText}
                      onPress={() => router.navigate(row.left.key)}
                    />
                  </View>

                  {row.right ? (
                    <View style={styles.tileCell}>
                      <DashboardTile
                        icon={row.right.icon}
                        title={row.right.title}
                        accentColor={row.right.accent}
                        imageSource={row.right.imageSource}
                        hideText={row.right.hideText}
                        onPress={() => router.navigate(row.right.key)}
                      />
                    </View>
                  ) : (
                    <View style={[styles.tileCell, styles.placeholderCell]} />
                  )}
                </View>
              );
            }

            return null;
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  row: {
    flexDirection: 'row',
    columnGap: 16,
  },
  tallRow: {
    flexDirection: 'row',
    columnGap: 16,
    alignItems: 'stretch',
  },
  stackColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  tileCell: {
    flex: 1,
  },
  stackItem: {
    flex: 1,
  },
  stackItemTop: {
    marginBottom: 16,
  },
  tallCell: {
    flex: 1,
  },
  placeholderCell: {
    opacity: 0,
  },
});
