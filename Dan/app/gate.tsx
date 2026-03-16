import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { View } from '@/components/Themed';
import { useAuth } from '@/components/AuthContext';

export default function GateScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // 1) No auth => login
    if (!isAuthenticated || !user) {
      router.replace('/');
      return;
    }

    const role = user.role;
    const teamId = user.teamId ?? null;

    // 2) Onboarding si no tiene team
    if (!teamId) {
      if (role === 'coach') router.replace('/(onboarding)/createTeam');
      else router.replace('/(onboarding)/joinTeam');
      return;
    }

    // 3) Apps por rol
    if (role === 'coach') router.replace('/(coachTabs)/home');
    else router.replace('/(memberTabs)/homeMembers');
  }, [isAuthenticated, user, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}