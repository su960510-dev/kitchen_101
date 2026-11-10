import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppImage, Chip, FieldLabel, Header, IconButton, InfoNote, PrimaryButton, Screen, ScreenScroll, SecondaryButton, Stepper, TextField, spacing, useStyles, type Colors } from '@/design-system';
import { userMessageOf } from '@/domain/errors';
import { RECIPE_CATEGORIES, type RecipeCategory, type RecipeDetail, type RecipeDifficulty } from '@/domain/models';
import { pickFromAlbum, takePhoto } from '@/features/inventory/photo-picker';
import { importPhoto } from '@/infrastructure/file-storage/app-files';
import { useAppState, useDb } from '@/hooks/app-state';
import { notify } from '@/utils/dialogs';

import { saveRecipe } from './recipe-service';
import type { ParsedRecipeText } from './recipe-text-parser';

/** 붙여넣은 글에서 만든 초안. 사용자가 확인·수정한 뒤에만 저장된다. */
export type RecipeDraft = ParsedRecipeText & { sourceUrl?: string; sourceLabel?: string };

interface IngredientDraft {
  name: string;
  quantity: string;
  unit: string;
  text: string;
  note?: string;
}

const DIFFICULTIES: RecipeDifficulty[] = ['하', '중', '상'];

export function RecipeEditor({ initial, draft }: { initial?: RecipeDetail; draft?: RecipeDraft }) {
  const db = useDb();
  const router = useRouter();
  const s = useStyles(styles);
  const { settings, refresh } = useAppState();
  const recipe = initial?.recipe;

  const [title, setTitle] = useState(recipe?.title ?? draft?.title ?? '');
  const [category, setCategory] = useState<RecipeCategory>(recipe?.category ?? '한식');
  const [servings, setServings] = useState(recipe?.baseServings ?? draft?.servings ?? settings.defaultServings);
  const [minutes, setMinutes] = useState(recipe?.cookMinutes != null ? String(recipe.cookMinutes) : draft?.minutes != null ? String(draft.minutes) : '');
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | undefined>(recipe?.difficulty);
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl ?? draft?.sourceUrl ?? '');
  // 초안의 팁은 레시피 메모에 목록으로 모은다.
  const [note, setNote] = useState(recipe?.note ?? (draft?.tips?.length ? ['팁', ...draft.tips.map((t) => `- ${t}`)].join('\n') : ''));
  const [photo, setPhoto] = useState(recipe?.imageUri);
  const [photoIsNew, setPhotoIsNew] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    initial?.ingredients.length
      ? initial.ingredients.map((i) => ({ name: i.displayName, quantity: i.quantity != null ? String(i.quantity) : '', unit: i.unit ?? '', text: i.quantityText ?? '', note: i.note }))
      : draft?.ingredients.length
        ? draft.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity != null ? String(i.quantity) : i.text ?? '',
            unit: i.unit ?? '',
            text: i.text ?? '',
            note: [i.group === '양념' ? '양념' : undefined, i.note].filter(Boolean).join(', ') || undefined,
          }))
        : [{ name: '', quantity: '', unit: '', text: '' }],
  );
  const [steps, setSteps] = useState<{ instruction: string; personalNote?: string }[]>(
    initial?.steps.length
      ? initial.steps.map((x) => ({ instruction: x.instruction, personalNote: x.personalNote }))
      : draft?.steps.length
        ? draft.steps.map((instruction) => ({ instruction }))
        : [{ instruction: '' }],
  );
  const [saving, setSaving] = useState(false);

  const updateIngredient = (index: number, patch: Partial<IngredientDraft>) => setIngredients((list) => list.map((x, i) => (i === index ? { ...x, ...patch } : x)));

  const save = async () => {
    setSaving(true);
    try {
      let imageUri = photo;
      if (photo && photoIsNew) imageUri = await importPhoto(photo, 'recipes', recipe?.id ?? `new${Date.now()}`);
      const saved = await saveRecipe(db, {
        id: recipe?.id,
        title,
        category,
        baseServings: servings,
        cookMinutes: minutes.trim() ? Number(minutes) : undefined,
        prepMinutes: recipe?.prepMinutes,
        difficulty,
        sourceUrl: sourceUrl.trim() || undefined,
        userProvidedSourceTitle: recipe?.userProvidedSourceTitle,
        note,
        imageUri,
        ingredients: ingredients.map((i) => {
          const value = i.quantity.trim() ? Number(i.quantity) : undefined;
          return { displayName: i.name, quantity: value != null && Number.isFinite(value) ? value : undefined, unit: i.unit, quantityText: i.text || (value == null ? i.quantity : undefined), note: i.note };
        }),
        steps,
      });
      refresh();
      if (recipe) router.back();
      else router.replace({ pathname: '/recipes/[id]', params: { id: saved.id } });
    } catch (error) {
      notify(userMessageOf(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title={recipe ? '레시피 수정' : '레시피 등록'} />
      <ScreenScroll footer={<PrimaryButton label="레시피 저장" onPress={save} loading={saving} />}>
        {draft ? <InfoNote>{draft.sourceLabel ?? '붙여넣은 글'}에서 정리한 초안이에요. 재료와 순서를 확인하고 고친 뒤 저장해 주세요.</InfoNote> : null}
        {photo ? <AppImage uri={photo} style={s.photo} label="레시피 사진" /> : null}
        <View style={s.row}>
          <SecondaryButton
            label="사진 촬영"
            icon="camera"
            onPress={async () => {
              const r = await takePhoto();
              if (r.denied) notify('카메라 권한이 없어요', '앨범에서 선택할 수 있어요.');
              if (r.uri) {
                setPhoto(r.uri);
                setPhotoIsNew(true);
              }
            }}
          />
          <SecondaryButton
            label="앨범 선택"
            icon="image"
            onPress={async () => {
              const uri = await pickFromAlbum();
              if (uri) {
                setPhoto(uri);
                setPhotoIsNew(true);
              }
            }}
          />
        </View>

        <FieldLabel>이름</FieldLabel>
        <TextField value={title} onChangeText={setTitle} placeholder="레시피 이름" />

        <FieldLabel>카테고리</FieldLabel>
        <View style={s.wrap}>
          {RECIPE_CATEGORIES.map((k) => (
            <Chip key={k} label={k} selected={category === k} onPress={() => setCategory(k)} />
          ))}
        </View>

        <FieldLabel>기준 인원수</FieldLabel>
        <Stepper label="기준 인원수" value={servings} suffix="인분" onChange={setServings} />

        <FieldLabel>조리 시간·난이도 (선택)</FieldLabel>
        <TextField value={minutes} onChangeText={setMinutes} placeholder="조리 시간(분)" keyboardType="number-pad" />
        <View style={[s.wrap, { marginTop: spacing.sm }]}>
          {DIFFICULTIES.map((d) => (
            <Chip key={d} label={`난이도 ${d}`} selected={difficulty === d} onPress={() => setDifficulty(difficulty === d ? undefined : d)} />
          ))}
        </View>

        <FieldLabel>재료</FieldLabel>
        <Text style={s.hint}>숫자로 적으면 인원수에 맞춰 계산해요. “약간”처럼 적으면 그대로 둬요.</Text>
        {ingredients.map((item, index) => (
          <View key={index} style={s.ingredient}>
            <View style={s.row}>
              <TextField value={item.name} onChangeText={(t) => updateIngredient(index, { name: t })} placeholder="재료명" style={{ flex: 2 }} />
              <TextField value={item.quantity} onChangeText={(t) => updateIngredient(index, { quantity: t })} placeholder="양" style={{ flex: 1 }} />
              <TextField value={item.unit} onChangeText={(t) => updateIngredient(index, { unit: t })} placeholder="단위" style={{ flex: 1 }} />
              <IconButton icon="close" label="재료 삭제" size={20} onPress={() => setIngredients((list) => list.filter((_, i) => i !== index))} />
            </View>
          </View>
        ))}
        <SecondaryButton label="재료 추가" icon="plus" onPress={() => setIngredients((list) => [...list, { name: '', quantity: '', unit: '', text: '' }])} />

        <FieldLabel>조리 순서</FieldLabel>
        {steps.map((step, index) => (
          <View key={index} style={s.step}>
            <Text style={s.stepNumber}>{index + 1}</Text>
            <TextField value={step.instruction} onChangeText={(t) => setSteps((list) => list.map((x, i) => (i === index ? { ...x, instruction: t } : x)))} placeholder="이 단계에서 할 일" multiline style={{ flex: 1 }} />
            <IconButton icon="close" label="단계 삭제" size={20} onPress={() => setSteps((list) => list.filter((_, i) => i !== index))} />
          </View>
        ))}
        <SecondaryButton label="단계 추가" icon="plus" onPress={() => setSteps((list) => [...list, { instruction: '', personalNote: undefined }])} />

        <FieldLabel>원본 링크 (선택)</FieldLabel>
        <TextField value={sourceUrl} onChangeText={setSourceUrl} placeholder="https://" autoCapitalize="none" keyboardType="url" />

        <FieldLabel>메모 (선택)</FieldLabel>
        <TextField value={note} onChangeText={setNote} placeholder="우리 집 입맛 메모" multiline />
      </ScreenScroll>
    </Screen>
  );
}

const styles = (c: Colors) =>
  StyleSheet.create({
    photo: { width: '100%', aspectRatio: 1.6, borderRadius: 20, marginBottom: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    hint: { color: c.sub, fontSize: 13, marginBottom: spacing.sm },
    ingredient: { marginBottom: spacing.sm },
    step: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: spacing.sm },
    stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: c.neutralBg, color: c.ink, textAlign: 'center', lineHeight: 26, fontWeight: '700', marginTop: 12, overflow: 'hidden' },
  });
