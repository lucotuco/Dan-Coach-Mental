import HeaderLogo from '@/components/HeaderLogo';
import BackButton from '@/components/BackButton';
type HeaderTheme = {
  background: string;
  text: string;
};

export const createSharedHeaderOptions = (theme: HeaderTheme) => ({
  headerTitle: () => <HeaderLogo />,
  headerLeft: () => (
    <BackButton />
  ),
  headerTitleAlign: 'center' as const,
  headerStyle: {
    backgroundColor: theme.background,
    boxShadowProp: {
      boxShadow: {
        offsetX: 0,
        offsetY: 0,
        blurRadius: 0,
        spreadDistance: 0,
        color: 'transparent',
      },
    },
    elevation: 0,
  },
  headerTintColor: theme.text,
  headerShadowVisible: false,
});
export const withoutBackButton = {
  headerLeft: () => null,
};