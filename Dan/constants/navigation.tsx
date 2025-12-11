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
    shadowColor: 'transparent',
    elevation: 0,
  },
  headerTintColor: theme.text,
  headerShadowVisible: false,
});
export const withoutBackButton = {
  headerLeft: () => null,
};