import * as Linking from 'expo-linking';
import { StyleSheet, Text } from 'react-native';

import { Card, Header, RowLink, Screen, ScreenScroll, spacing, useStyles, type Colors } from '@/design-system';
import { SAFETY_COPY } from '@/features/food-safety/safety-copy';

const SOURCES = [
  { label: '식품의약품안전처', url: 'https://www.mfds.go.kr/' },
  { label: '식품안전정보원', url: 'https://www.foodinfo.or.kr/' },
  { label: '정책브리핑 소비기한 안내', url: 'https://www.korea.kr/news/healthView.do?newsId=148911057' },
];

export default function AboutScreen() {
  const s = useStyles(styles);
  return (
    <Screen>
      <Header title="안내" />
      <ScreenScroll>
        <Text style={s.section}>개인정보</Text>
        <Card style={s.card}>
          <Text style={s.body}>로그인, 분석 도구, 광고 SDK가 없어요. 식재료, 가족 레시피, 사진, 라벨 인식 내용은 이 기기 안에만 저장되고 외부 서버로 전송하지 않아요. 사진은 직접 고르거나 촬영한 것만 처리해요. 외부 레시피 링크를 열 때만 해당 사이트로 연결돼요.</Text>
        </Card>

        <Text style={s.section}>식품 날짜 안내</Text>
        <Card style={s.card}>
          <Text style={s.body}>{SAFETY_COPY.appCannotInspect}</Text>
          <Text style={s.body}>포장에 적힌 날짜와 내가 정한 관리 알림은 서로 달라요. 앱은 구입일이나 보관 위치로 먹어도 되는 날짜를 계산하지 않아요. 제품 표시와 보관 지침을 따라 주세요.</Text>
          <Text style={s.body}>{SAFETY_COPY.allergyNote}</Text>
        </Card>

        <Text style={s.section}>공식 출처</Text>
        <Card style={s.card}>
          {SOURCES.map((source) => (
            <RowLink key={source.url} label={source.label} icon="external" onPress={() => Linking.openURL(source.url).catch(() => {})} />
          ))}
        </Card>

        <Text style={s.section}>레시피 저작권</Text>
        <Card style={s.card}>
          <Text style={s.body}>외부 레시피는 링크와 직접 쓴 제목·메모만 저장해요. 다른 사이트의 글, 사진, 영상, 자막을 복제하지 않아요.</Text>
        </Card>

        <Text style={s.section}>오픈소스 라이선스</Text>
        <Card style={s.card}>
          <Text style={s.body}>React Native, Expo 및 Expo 모듈, react-native-svg, react-native-screens, react-native-safe-area-context (MIT). 자세한 고지는 저장소의 docs/THIRD_PARTY_NOTICES.md 를 확인하세요.</Text>
        </Card>
      </ScreenScroll>
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    section: { color: c.sub, fontSize: 13, fontWeight: '600', marginTop: spacing.xl, marginBottom: spacing.sm },
    card: { padding: spacing.lg, gap: spacing.sm },
    body: { color: c.ink, fontSize: 14, lineHeight: 21 },
  });
