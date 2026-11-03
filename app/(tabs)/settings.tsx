import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Header, OptionSheet, RowLink, Screen, ScreenScroll, Stepper, ToggleRow, softShadow, spacing, useStyles, type Colors } from '@/design-system';
import { requestPermission } from '@/infrastructure/notifications/local-notifications';
import { useAppState } from '@/hooks/app-state';
import { notify } from '@/utils/dialogs';

const LEAD_OPTIONS = [1, 3, 5, 7, 14].map((d) => ({ value: d, label: `${d}일 전부터` }));
const THEME_OPTIONS = [
  { value: 'SYSTEM' as const, label: '시스템 설정 따르기' },
  { value: 'LIGHT' as const, label: '밝게' },
  { value: 'DARK' as const, label: '어둡게' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const s = useStyles(styles);
  const { settings, updateSettings } = useAppState();
  const [leadOpen, setLeadOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const toggleNotifications = async (next: boolean) => {
    if (next) {
      const state = await requestPermission();
      if (state !== 'granted') {
        notify('알림을 켤 수 없어요', state === 'unavailable' ? '이 실행 환경에서는 알림을 지원하지 않아요. 앱 사용에는 문제가 없어요.' : '시스템 설정에서 알림을 허용해 주세요. 알림 없이도 앱은 그대로 쓸 수 있어요.');
        return;
      }
    }
    await updateSettings({ notificationEnabled: next });
  };

  return (
    <Screen>
      <Header title="더보기" hideBack />
      <ScreenScroll>
        <Text style={s.section}>우리 집</Text>
        <Card style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>기본 인원수</Text>
            <Stepper label="기본 인원수" value={settings.defaultServings} suffix="인" max={20} onChange={(v) => updateSettings({ defaultServings: v })} />
          </View>
        </Card>

        <Text style={s.section}>알림</Text>
        <Card style={s.card}>
          <ToggleRow label="날짜 알림 받기" hint="항목별로 알림을 켠 식재료만 예약해요. 기기 안에서만 동작해요." value={settings.notificationEnabled} onChange={toggleNotifications} />
          <RowLink label="임박 표시 기준" hint={`표시 날짜 ${settings.reminderLeadDays}일 전부터 알려요`} onPress={() => setLeadOpen(true)} />
        </Card>

        <Text style={s.section}>화면</Text>
        <Card style={s.card}>
          <RowLink label="테마" hint={THEME_OPTIONS.find((t) => t.value === settings.theme)?.label} onPress={() => setThemeOpen(true)} />
        </Card>

        <Text style={s.section}>데이터</Text>
        <Card style={s.card}>
          <RowLink label="데이터 관리" hint="내보내기·복원·삭제, 소진 기록" onPress={() => router.push('/data-management')} />
        </Card>

        <Text style={s.section}>안내</Text>
        <Card style={s.card}>
          <RowLink label="개인정보·식품 날짜 안내·라이선스" onPress={() => router.push('/about')} />
        </Card>
      </ScreenScroll>

      <OptionSheet visible={leadOpen} onClose={() => setLeadOpen(false)} title="임박 표시 기준" options={LEAD_OPTIONS} value={settings.reminderLeadDays} onSelect={(v) => updateSettings({ reminderLeadDays: v })} />
      <OptionSheet visible={themeOpen} onClose={() => setThemeOpen(false)} title="테마" options={THEME_OPTIONS} value={settings.theme} onSelect={(v) => updateSettings({ theme: v })} />
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    section: { color: c.sub, fontSize: 13, fontWeight: '600', marginTop: spacing.xl, marginBottom: spacing.sm },
    card: { paddingHorizontal: spacing.lg, paddingVertical: 4, ...softShadow },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
    label: { color: c.ink, fontSize: 16, fontWeight: '500' },
  });
