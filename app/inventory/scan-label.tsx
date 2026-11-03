import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage, CalendarSheet, Header, Icon, InfoNote, OptionSheet, Pill, PrimaryButton, Screen, ScreenScroll, SecondaryButton, TextField, spacing, useColors, useStyles, type Colors } from '@/design-system';
import { formatFull, type DateOnly } from '@/domain/date-only';
import { logError, userMessageOf } from '@/domain/errors';
import type { DateType, OcrCandidate } from '@/domain/models';
import { DATE_TYPE_LABELS, SELECTABLE_LABEL_TYPES } from '@/features/food-safety/date-policy';
import { SAFETY_COPY } from '@/features/food-safety/safety-copy';
import { parseLabelLines, suggestProductNames, type ParsedLabel } from '@/features/food-label-ocr/date-candidate-parser';
import { confirmLabelDate } from '@/features/food-label-ocr/ocr-review-service';
import { getOcrProvider } from '@/features/food-label-ocr/providers';
import { pickFromAlbum, takePhoto } from '@/features/inventory/photo-picker';
import { notify } from '@/utils/dialogs';

type Stage = 'choose' | 'processing' | 'review' | 'failed';

/** 라벨 등록: 사진 선택 → 온디바이스 OCR → 후보 확인. 어떤 값도 사용자 확인 없이 확정하지 않는다. */
export default function ScanLabelScreen() {
  const router = useRouter();
  const s = useStyles(styles);
  const c = useColors();
  const [stage, setStage] = useState<Stage>('choose');
  const [photo, setPhoto] = useState<string>();
  const [parsed, setParsed] = useState<ParsedLabel | null>(null);
  const [rawText, setRawText] = useState('');
  const [names, setNames] = useState<string[]>([]);
  const [failure, setFailure] = useState('');

  const [selected, setSelected] = useState<string | null>(null);
  const [date, setDate] = useState<DateOnly>();
  const [type, setType] = useState<DateType>('UNKNOWN');
  const [yearConfirmed, setYearConfirmed] = useState(true);
  const [name, setName] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const run = async (uri: string) => {
    setPhoto(uri);
    setStage('processing');
    try {
      const provider = getOcrProvider();
      const capabilities = await provider.getCapabilities();
      if (!capabilities.available) {
        setFailure('이 실행 환경에서는 자동 인식을 쓸 수 없어요. 사진을 보며 직접 입력해 주세요.');
        setStage('failed');
        return;
      }
      const result = await provider.recognize(uri);
      const label = parseLabelLines(result.lines);
      setParsed(label);
      setRawText(result.rawText);
      setNames(suggestProductNames(result.lines));
      setStage('review');
      const first = label.candidates[0];
      if (first) choose(first);
    } catch (error) {
      logError('ocr', error);
      setFailure('글자를 읽지 못했어요. 직접 입력으로 계속할 수 있어요.');
      setStage('failed');
    }
  };

  const choose = (candidate: OcrCandidate) => {
    setSelected(candidate.id);
    setDate(candidate.candidateDate ?? candidate.suggestedDate);
    setType(candidate.candidateDateType);
    setYearConfirmed(!candidate.needsYearConfirmation);
  };

  const fromCamera = async () => {
    const result = await takePhoto();
    if (result.denied) notify('카메라 권한이 없어요', '앨범에서 선택하거나 직접 입력할 수 있어요.');
    if (result.uri) await run(result.uri);
  };
  const fromAlbum = async () => {
    const uri = await pickFromAlbum();
    if (uri) await run(uri);
  };

  const toManual = () => router.replace({ pathname: '/inventory/new', params: photo ? { photoUri: photo } : {} });

  const accept = () => {
    try {
      const confirmed = confirmLabelDate({ date, type, userConfirmed: yearConfirmed });
      router.replace({
        pathname: '/inventory/new',
        params: { fromOcr: '1', labelDate: confirmed.labelDate, labelDateType: confirmed.labelDateType, name, photoUri: photo, ocrText: rawText },
      });
    } catch (error) {
      notify(userMessageOf(error));
    }
  };

  if (stage === 'choose') {
    return (
      <Screen>
        <Header title="포장 라벨 인식" />
        <ScreenScroll>
          <Text style={s.lead}>라벨 사진 한 장을 기기 안에서 읽어요. 사진은 밖으로 전송하지 않아요.</Text>
          <View style={{ gap: 10, marginTop: spacing.xl }}>
            <PrimaryButton label="포장 라벨 촬영" icon="camera" onPress={fromCamera} />
            <SecondaryButton label="앨범에서 선택" icon="image" onPress={fromAlbum} />
            <SecondaryButton label="직접 입력" icon="note" onPress={toManual} />
          </View>
          <InfoNote>{SAFETY_COPY.ocrIsCandidate}</InfoNote>
        </ScreenScroll>
      </Screen>
    );
  }

  if (stage === 'processing') {
    return (
      <Screen>
        <Header title="포장 라벨 인식" />
        <View style={s.center}>
          <ActivityIndicator color={c.green} size="large" />
          <Text style={s.lead}>기기 안에서 글자를 읽는 중이에요</Text>
        </View>
      </Screen>
    );
  }

  if (stage === 'failed') {
    return (
      <Screen>
        <Header title="포장 라벨 인식" />
        <ScreenScroll footer={<PrimaryButton label="직접 입력으로 계속" onPress={toManual} />}>
          {photo ? <AppImage uri={photo} style={s.photo} label="선택한 라벨 사진" /> : null}
          <Text style={[s.lead, { marginTop: spacing.lg }]}>{failure}</Text>
          <View style={{ marginTop: spacing.md }}>
            <SecondaryButton label="다른 사진 선택" icon="image" onPress={fromAlbum} />
          </View>
        </ScreenScroll>
      </Screen>
    );
  }

  const candidates = parsed?.candidates ?? [];
  return (
    <Screen>
      <Header title="인식 결과 확인" />
      <ScreenScroll footer={<PrimaryButton label="이 내용으로 입력 계속" onPress={accept} disabled={!date || type === 'UNKNOWN' || !yearConfirmed} />}>
        {photo ? <AppImage uri={photo} style={s.photo} label="선택한 라벨 사진" /> : null}
        <InfoNote icon="alert">{SAFETY_COPY.ocrIsCandidate}</InfoNote>

        <Text style={s.section}>날짜 후보 {candidates.length}개</Text>
        {candidates.length === 0 ? <Text style={s.lead}>날짜를 확인하지 못했어요. 직접 입력해 주세요.</Text> : null}
        {candidates.map((candidate) => {
          const active = selected === candidate.id;
          const value = candidate.candidateDate ?? candidate.suggestedDate;
          return (
            <Pressable key={candidate.id} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => choose(candidate)} style={[s.candidate, active && s.candidateActive]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.candidateDate}>{value ? formatFull(value) : '날짜 확인 필요'}</Text>
                <Text style={s.raw} numberOfLines={2}>
                  원문: {candidate.rawText}
                </Text>
              </View>
              <Pill text={DATE_TYPE_LABELS[candidate.candidateDateType]} tone={candidate.candidateDateType === 'UNKNOWN' ? 'expired' : 'neutral'} />
            </Pressable>
          );
        })}
        {parsed?.rejected.length ? <Text style={s.raw}>달력에 없는 날짜라 뺐어요: {parsed.rejected.join(', ')}</Text> : null}
        {parsed?.notices.includes('SEE_SEPARATE_MARKING') ? <InfoNote>라벨에 “별도 표기”가 있어요. 포장의 다른 면에서 날짜를 확인해 주세요.</InfoNote> : null}
        {parsed?.notices.includes('OPENED_STORAGE_GUIDANCE') ? <InfoNote>“개봉 후” 보관 안내가 있어요. 제조사 보관 지침을 확인해 주세요.</InfoNote> : null}

        <Text style={s.section}>확인할 값</Text>
        <Pressable accessibilityRole="button" onPress={() => setCalendarOpen(true)} style={s.field}>
          <Icon name="calendar" size={20} />
          <Text style={s.fieldValue}>{date ? formatFull(date) : '날짜 선택'}</Text>
          <Icon name="chevron" size={16} color={c.hint} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setTypeOpen(true)} style={s.field}>
          <Icon name="note" size={20} />
          <Text style={[s.fieldValue, type === 'UNKNOWN' && { color: c.alertText }]}>{type === 'UNKNOWN' ? '날짜 종류를 선택해 주세요' : DATE_TYPE_LABELS[type]}</Text>
          <Icon name="chevron" size={16} color={c.hint} />
        </Pressable>
        {!yearConfirmed ? (
          <View style={s.yearBox}>
            <Text style={s.lead}>라벨의 연도가 두 자리예요. {date?.slice(0, 4)}년이 맞는지 포장을 보고 확인해 주세요.</Text>
            <SecondaryButton label={`${date?.slice(0, 4)}년이 맞아요`} onPress={() => setYearConfirmed(true)} />
          </View>
        ) : null}

        <Text style={s.section}>상품명</Text>
        <TextField value={name} onChangeText={setName} placeholder="상품명" />
        <View style={s.names}>
          {names.map((n) => (
            <Pressable key={n} accessibilityRole="button" onPress={() => setName(n)} style={s.nameChip}>
              <Text style={s.raw}>{n}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>인식된 원문</Text>
        <Text style={s.raw}>{rawText || '인식된 글자가 없어요.'}</Text>

        <View style={{ marginTop: spacing.lg }}>
          <SecondaryButton label="직접 입력으로 전환" onPress={toManual} />
        </View>
      </ScreenScroll>

      <OptionSheet visible={typeOpen} onClose={() => setTypeOpen(false)} title="포장에 적힌 날짜 종류" value={type} options={SELECTABLE_LABEL_TYPES.map((t) => ({ value: t, label: DATE_TYPE_LABELS[t] }))} onSelect={setType} />
      <CalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} title="날짜 확인" value={date} onSelect={(d) => { setDate(d); setYearConfirmed(true); }} />
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    lead: { color: c.sub, fontSize: 15, lineHeight: 22 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
    photo: { width: '100%', aspectRatio: 1.5, borderRadius: 20 },
    section: { color: c.ink, fontSize: 17, fontWeight: '700', marginTop: spacing.xl, marginBottom: 10 },
    candidate: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surface, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
    candidateActive: { borderColor: c.green },
    candidateDate: { color: c.ink, fontSize: 17, fontWeight: '700' },
    raw: { color: c.sub, fontSize: 13, lineHeight: 18 },
    field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, borderRadius: 16, minHeight: 56, paddingHorizontal: 14, marginBottom: 8 },
    fieldValue: { flex: 1, color: c.ink, fontSize: 16, fontWeight: '600' },
    yearBox: { gap: 10, backgroundColor: c.soonBg, borderRadius: 14, padding: 14 },
    names: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    nameChip: { backgroundColor: c.neutralBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  });
