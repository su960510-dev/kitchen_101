import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, ILLUSTRATIONS, PrimaryButton, Screen, ScreenScroll, SecondaryButton, Stepper, ToggleRow, spacing, useStyles, type Colors } from '@/design-system';
import { requestPermission } from '@/infrastructure/notifications/local-notifications';
import { seedSampleData } from '@/features/sample-data/sample-data';
import { useAppState, useDb } from '@/hooks/app-state';

/** 첫 실행 안내. 모든 입력은 선택이며 건너뛸 수 있다. */
export default function OnboardingScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const { updateSettings, refresh } = useAppState();
  const [servings, setServings] = useState(2);
  const [notify, setNotify] = useState(false);

  const finish = async (withSamples: boolean) => {
    let notificationEnabled = false;
    if (notify) notificationEnabled = (await requestPermission()) === 'granted';
    if (withSamples) await seedSampleData(db);
    await updateSettings({ defaultServings: servings, notificationEnabled, onboardingDone: true });
    refresh();
    router.replace('/');
  };

  return (
    <Screen>
      <ScreenScroll
        contentStyle={{ paddingHorizontal: 0 }}
        footer={
          <View style={{ gap: 10 }}>
            <PrimaryButton label="예시 데이터로 둘러보기" onPress={() => finish(true)} />
            <SecondaryButton label="빈 냉장고로 시작하기" onPress={() => finish(false)} />
          </View>
        }>
        <Image source={ILLUSTRATIONS.vegBowl} style={s.hero} contentFit="cover" accessibilityLabel="채소가 담긴 그릇" />
        <View style={s.body}>
          <Text accessibilityRole="header" style={s.title}>
            주부1단
          </Text>
          <Text style={s.brand}>주부 9단 되기 프로젝트</Text>
          <Text style={s.desc}>우리 집 식재료 날짜를 놓치지 않고, 가족 레시피를 우리 집 입맛에 맞게 정착시켜요.</Text>

          <Card style={s.card}>
            <View style={s.row}>
              <Text style={s.label}>가구 기본 인원</Text>
              <Stepper label="가구 기본 인원" value={servings} suffix="인" max={20} onChange={setServings} />
            </View>
            <ToggleRow label="날짜 알림 사용" hint="언제든 더보기에서 바꿀 수 있어요." value={notify} onChange={setNotify} />
          </Card>

          <Text style={s.note}>모든 데이터는 이 기기 안에만 저장돼요. 로그인이 필요 없고, 사진과 라벨 내용은 외부로 전송하지 않아요.</Text>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    hero: { width: '100%', height: 260 },
    body: { paddingHorizontal: spacing.xl, paddingBottom: 90 },
    title: { color: c.ink, fontSize: 30, fontWeight: '800', marginTop: spacing.md, letterSpacing: -0.6 },
    brand: { color: c.greenDark, fontSize: 15, fontWeight: '600', marginTop: 4 },
    desc: { color: c.sub, fontSize: 15, lineHeight: 22, marginTop: spacing.md },
    card: { marginTop: spacing.xl, paddingHorizontal: spacing.lg, paddingVertical: 6 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
    label: { color: c.ink, fontSize: 16, fontWeight: '500' },
    note: { color: c.sub, fontSize: 13, lineHeight: 19, marginTop: spacing.lg },
  });
