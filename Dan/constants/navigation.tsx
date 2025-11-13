import HeaderLogo from '@/components/HeaderLogo';

type HeaderTheme = {
  background: string;
  text: string;
};

export const createSharedHeaderOptions = (theme: HeaderTheme) => ({
  headerTitle: () => <HeaderLogo />,
  headerTitleAlign: 'center' as const,
  headerStyle: {
    backgroundColor: theme.background,
    shadowColor: 'transparent',
    elevation: 0,
  },
  headerTintColor: theme.text,
  headerShadowVisible: false,
});
