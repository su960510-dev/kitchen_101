import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, useColors, type IconName } from '@/design-system';

const icon = (outline: IconName, filled: IconName) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    return <Icon name={focused ? filled : outline} size={26} color={color as string} strokeWidth={1.6} />;
  };

/** 하단 탭 4개. 보드대로 냉장고 탭은 탭바 대신 하단 추가 버튼을 쓰고, 뒤로가기로 홈에 돌아온다. */
export default function TabsLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.hint,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line, height: 74 + insets.bottom, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10) },
      }}>
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: icon('home', 'home-filled') }} />
      <Tabs.Screen name="inventory" options={{ title: '냉장고', tabBarIcon: icon('fridge', 'fridge-filled'), tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="recipes" options={{ title: '레시피', tabBarIcon: icon('recipe', 'chef-filled') }} />
      <Tabs.Screen name="settings" options={{ title: '더보기', tabBarIcon: icon('more', 'more-filled') }} />
    </Tabs>
  );
}
