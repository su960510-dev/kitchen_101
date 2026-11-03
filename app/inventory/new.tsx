import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppImage, CalendarSheet, Chip, DateRow, FieldLabel, Header, ILLUSTRATIONS, IconButton, Icon, InfoNote, OptionSheet, PrimaryButton, SampleBadge, Screen, ScreenScroll, TextField, ToggleRow, spacing, useColors, useStyles, type Colors, type IconName } from '@/design-system';
import { isDateOnly, todayKst, type DateOnly } from '@/domain/date-only';
import { userMessageOf } from '@/domain/errors';
import { CATEGORY_LABELS, type DateSource, type DateType, type InventoryCategory, type StorageLocation } from '@/domain/models';
import { DATE_TYPE_LABELS, SELECTABLE_LABEL_TYPES } from '@/features/food-safety/date-policy';
import { SAFETY_COPY } from '@/features/food-safety/safety-copy';
import { saveItem } from '@/features/inventory/inventory-service';
import { pickFromAlbum, takePhoto } from '@/features/inventory/photo-picker';
import { requestPermission } from '@/infrastructure/notifications/local-notifications';
import { deleteFile, importPhoto } from '@/infrastructure/file-storage/app-files';
import { inventoryRepository } from '@/infrastructure/database/repositories/inventory-repository';
import { useAppState, useDb } from '@/hooks/app-state';
import { notify } from '@/utils/dialogs';

type DateField = 'label' | 'reminder' | 'purchase' | 'received' | 'opened' | 'cooked';

const STORAGES: { key: StorageLocation; label: string; icon: IconName }[] = [
  { key: 'FRIDGE', label: '냉장', icon: 'snow' },
  { key: 'FREEZER', label: '냉동', icon: 'fridge-door' },
  { key: 'PANTRY', label: '상온', icon: 'pantry' },
];

export default function InventoryFormScreen() {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const c = useColors();
  const { settings, updateSettings, refresh } = useAppState();
  const params = useLocalSearchParams<{
    id?: string;
    mom?: string;
    labelDate?: string;
    labelDateType?: DateType;
    fromOcr?: string;
    name?: string;
    photoUri?: string;
    ocrText?: string;
  }>();
  const editing = !!params.id;
  const isMomInitial = params.mom === '1';
  const fromOcr = params.fromOcr === '1' && isDateOnly(params.labelDate);

  const [name, setName] = useState(params.name ?? '');
  const [category, setCategory] = useState<InventoryCategory>(isMomInitial ? 'SIDE_DISH' : 'VEGETABLE');
  const [storage, setStorage] = useState<StorageLocation>('FRIDGE');
  const [labelDate, setLabelDate] = useState<DateOnly | undefined>(fromOcr ? params.labelDate : undefined);
  const [labelType, setLabelType] = useState<DateType>(fromOcr && params.labelDateType ? params.labelDateType : 'USE_BY');
  const [dateSource, setDateSource] = useState<DateSource | undefined>(fromOcr ? 'OCR_CONFIRMED' : undefined);
  const [reminder, setReminder] = useState<DateOnly>();
  const [purchase, setPurchase] = useState<DateOnly>();
  const [received, setReceived] = useState<DateOnly | undefined>(isMomInitial ? todayKst() : undefined);
  const [opened, setOpened] = useState<DateOnly>();
  const [cooked, setCooked] = useState<DateOnly>();
  const [isMom, setIsMom] = useState(isMomInitial);
  const [isOpened, setIsOpened] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>(params.photoUri);
  const [photoIsNew, setPhotoIsNew] = useState(!!params.photoUri);
  // 라벨 사진은 기본 보관하지 않는다(§4.5). 사용자가 직접 찍은 음식 사진은 보관한다.
  const [keepPhoto, setKeepPhoto] = useState(!params.photoUri);
  const [keepOcrText, setKeepOcrText] = useState(false);
  const [more, setMore] = useState(isMomInitial || editing);
  const [picker, setPicker] = useState<DateField | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    inventoryRepository.get(db, params.id).then((item) => {
      if (!item) return;
      setName(item.name);
      setCategory(item.category);
      setStorage(item.storageLocation);
      setLabelDate(item.labelDate);
      if (item.labelDateType) setLabelType(item.labelDateType);
      setDateSource(item.dateSource);
      setReminder(item.personalReminderDate);
      setPurchase(item.purchaseDate);
      setReceived(item.receivedDate);
      setOpened(item.openedDate);
      setCooked(item.cookedDate);
      setIsMom(item.isMomSideDish);
      setIsOpened(item.isOpened);
      setQuantity(item.quantity != null ? String(item.quantity) : '');
      setUnit(item.unit ?? '');
      setNote(item.note ?? '');
      setNotifyEnabled(item.notifyEnabled);
      setPhotoUri(item.localPhotoUri);
    });
  }, [db, params.id]);

  const setDate = (field: DateField, value: DateOnly | undefined) => {
    if (field === 'label') {
      setLabelDate(value);
      // 직접 고친 날짜는 더 이상 OCR 값이 아니지만, 확인 화면을 거친 값이면 출처를 유지한다.
      if (!fromOcr) setDateSource(value ? 'MANUAL' : undefined);
    }
    if (field === 'reminder') setReminder(value);
    if (field === 'purchase') setPurchase(value);
    if (field === 'received') setReceived(value);
    if (field === 'opened') {
      setOpened(value);
      if (value) setIsOpened(true);
    }
    if (field === 'cooked') setCooked(value);
  };
  const dateValue: Record<DateField, DateOnly | undefined> = { label: labelDate, reminder, purchase, received, opened, cooked };
  const dateTitle: Record<DateField, string> = {
    label: DATE_TYPE_LABELS[labelType],
    reminder: '내 관리 알림 날짜',
    purchase: '구입일',
    received: '받은 날짜',
    opened: '개봉일',
    cooked: '조리일',
  };

  const pick = async (source: 'camera' | 'album') => {
    if (source === 'album') {
      const uri = await pickFromAlbum();
      if (uri) {
        setPhotoUri(uri);
        setPhotoIsNew(true);
        setKeepPhoto(true);
      }
      return;
    }
    const result = await takePhoto();
    if (result.denied) notify('카메라 권한이 없어요', '직접 입력이나 앨범 선택으로 계속할 수 있어요.');
    if (result.uri) {
      setPhotoUri(result.uri);
      setPhotoIsNew(true);
      setKeepPhoto(true);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const id = params.id;
      let storedPhoto = photoIsNew ? undefined : photoUri;
      if (photoIsNew && photoUri && keepPhoto) storedPhoto = await importPhoto(photoUri, 'inventory', id ?? `new${Date.now()}`);
      if (!photoIsNew && !photoUri) storedPhoto = undefined;
      const parsedQuantity = quantity.trim() === '' ? undefined : Number(quantity);
      const saved = await saveItem(db, {
        id,
        name,
        category,
        storageLocation: storage,
        quantity: parsedQuantity,
        unit,
        purchaseDate: purchase,
        receivedDate: received,
        openedDate: opened,
        cookedDate: cooked,
        labelDate,
        labelDateType: labelDate ? labelType : undefined,
        personalReminderDate: reminder,
        dateSource: labelDate ? dateSource ?? 'MANUAL' : undefined,
        notifyEnabled,
        isMomSideDish: isMom,
        isOpened,
        note,
        localPhotoUri: storedPhoto,
        ocrText: fromOcr && keepOcrText ? params.ocrText : undefined,
      });
      if (notifyEnabled && !settings.notificationEnabled && (await requestPermission()) === 'granted') await updateSettings({ notificationEnabled: true });
      // 임시 라벨 사진은 보관을 선택하지 않으면 남기지 않는다.
      if (photoIsNew && photoUri && !keepPhoto) deleteFile(photoUri);
      refresh();
      if (editing) router.back();
      else router.replace({ pathname: '/inventory/[id]', params: { id: saved.id } });
    } catch (error) {
      notify(userMessageOf(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title={editing ? '식재료 수정' : isMom ? '엄마표 반찬 등록' : '식재료 추가'} right={<IconButton icon="scan" label="포장 라벨 인식" onPress={() => router.replace('/inventory/scan-label')} />} />
      <ScreenScroll footer={<PrimaryButton label={editing ? '저장하기' : '추가하기'} onPress={save} loading={saving} />}>
        <View style={s.photoBox}>
          {photoUri ? (
            <AppImage uri={photoUri} style={s.photo} fallback={<View style={[s.photo, { backgroundColor: c.neutralBg }]} />} label="선택한 사진" />
          ) : (
            <>
              <Image source={ILLUSTRATIONS.labelSample} style={s.photo} contentFit="cover" accessibilityLabel="포장 라벨 예시 이미지" />
              <View style={s.sampleTag}>
                <SampleBadge />
              </View>
            </>
          )}
          <View style={s.photoActions}>
            <Pressable accessibilityRole="button" onPress={() => pick('camera')} style={s.photoAction}>
              <Icon name="camera" size={18} />
              <Text style={s.photoActionText}>촬영</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => pick('album')} style={s.photoAction}>
              <Icon name="image" size={18} />
              <Text style={s.photoActionText}>앨범</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 16 }} />
        <TextField value={name} onChangeText={setName} placeholder={isMom ? '음식 이름 (예: 멸치볶음)' : '식재료 이름'} label="이름" />
        <View style={{ height: 12 }} />

        {isMom ? (
          <DateRow label="받은 날짜" value={received} onPress={() => setPicker('received')} />
        ) : (
          <>
            <DateRow label={DATE_TYPE_LABELS[labelType]} value={labelDate} placeholder="날짜 없음 · 선택 입력" onPress={() => setPicker('label')} hint={dateSource === 'OCR_CONFIRMED' ? '라벨 인식 후 직접 확인한 날짜예요' : undefined} />
            <Pressable accessibilityRole="button" onPress={() => setTypeOpen(true)} style={s.inline}>
              <Text style={s.inlineText}>포장에 적힌 날짜 종류 바꾸기</Text>
              <Icon name="chevron" size={14} color={c.sub} />
            </Pressable>
          </>
        )}

        <FieldLabel>보관 방법</FieldLabel>
        <View style={s.chips}>
          {STORAGES.map((o) => (
            <Chip key={o.key} label={o.label} icon={o.icon} selected={storage === o.key} onPress={() => setStorage(o.key)} />
          ))}
        </View>

        <Pressable accessibilityRole="button" accessibilityState={{ expanded: more }} onPress={() => setMore((v) => !v)} style={s.moreToggle}>
          <Text style={s.moreText}>{more ? '간단히 입력하기' : '자세히 입력하기'}</Text>
        </Pressable>

        {more ? (
          <>
            <FieldLabel>분류</FieldLabel>
            <Chip label={CATEGORY_LABELS[category]} selected onPress={() => setCategoryOpen(true)} />

            <FieldLabel>수량 (선택)</FieldLabel>
            <View style={s.qtyRow}>
              <TextField value={quantity} onChangeText={setQuantity} placeholder="수량" keyboardType="decimal-pad" style={{ flex: 1 }} />
              <TextField value={unit} onChangeText={setUnit} placeholder="단위 (개, g, 통)" style={{ flex: 1 }} />
            </View>

            <FieldLabel>관리 알림</FieldLabel>
            <DateRow label="내 관리 알림 날짜" value={reminder} placeholder="미설정" onPress={() => setPicker('reminder')} />
            <InfoNote>{isMom ? SAFETY_COPY.momSideDishNote : SAFETY_COPY.personalReminderNote}</InfoNote>
            <ToggleRow label="날짜 알림 받기" hint="표시 날짜와 내 관리 알림을 각각 알려요." value={notifyEnabled} onChange={setNotifyEnabled} />

            <FieldLabel>기록 (선택)</FieldLabel>
            {!isMom ? <DateRow label="구입일" value={purchase} placeholder="미입력" onPress={() => setPicker('purchase')} /> : null}
            {isMom ? null : <DateRow label="받은 날짜" value={received} placeholder="미입력" onPress={() => setPicker('received')} />}
            <DateRow label="조리일" value={cooked} placeholder="미입력" onPress={() => setPicker('cooked')} />
            <ToggleRow label="개봉했어요" value={isOpened} onChange={setIsOpened} />
            {isOpened ? <DateRow label="개봉일" value={opened} placeholder="미입력" onPress={() => setPicker('opened')} /> : null}
            <ToggleRow label="엄마표 반찬" hint="출처 표시예요. 신선도를 보증하지 않아요." value={isMom} onChange={(v) => { setIsMom(v); if (v) { setCategory('SIDE_DISH'); if (!received) setReceived(todayKst()); } }} />

            <FieldLabel>메모 (선택)</FieldLabel>
            <TextField value={note} onChangeText={setNote} placeholder="엄마에게 확인한 재료, 데우는 방법 등" multiline />
          </>
        ) : null}

        {params.photoUri ? <ToggleRow label="라벨 사진 보관" hint="기본은 보관하지 않아요. 켜면 앱 전용 폴더에만 저장해요." value={keepPhoto} onChange={setKeepPhoto} /> : null}
        {fromOcr && params.ocrText ? <ToggleRow label="인식 원문 보관" hint="기본은 보관하지 않아요. 나중에 데이터 관리에서 지울 수 있어요." value={keepOcrText} onChange={setKeepOcrText} /> : null}
      </ScreenScroll>

      <CalendarSheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker ? dateTitle[picker] : ''}
        value={picker ? dateValue[picker] : undefined}
        onSelect={(d) => picker && setDate(picker, d)}
        onClear={picker && dateValue[picker] ? () => setDate(picker, undefined) : undefined}
      />
      <OptionSheet visible={typeOpen} onClose={() => setTypeOpen(false)} title="포장에 적힌 날짜 종류" value={labelType} options={SELECTABLE_LABEL_TYPES.map((t) => ({ value: t, label: DATE_TYPE_LABELS[t] }))} onSelect={setLabelType} />
      <OptionSheet visible={categoryOpen} onClose={() => setCategoryOpen(false)} title="분류" value={category} options={(Object.keys(CATEGORY_LABELS) as InventoryCategory[]).map((k) => ({ value: k, label: CATEGORY_LABELS[k] }))} onSelect={setCategory} />
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    photoBox: { borderRadius: 20, overflow: 'hidden', backgroundColor: c.neutralBg },
    photo: { width: '100%', aspectRatio: 1.16 },
    sampleTag: { position: 'absolute', top: 10, left: '46%' },
    photoActions: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', gap: 8 },
    photoAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.surface, borderRadius: 999, paddingHorizontal: 12, minHeight: 36 },
    photoActionText: { color: c.ink, fontSize: 13, fontWeight: '600' },
    inline: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
    inlineText: { color: c.sub, fontSize: 13 },
    chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    moreToggle: { alignSelf: 'center', paddingVertical: 12, marginTop: spacing.lg },
    moreText: { color: c.sub, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
    qtyRow: { flexDirection: 'row', gap: 10 },
  });
