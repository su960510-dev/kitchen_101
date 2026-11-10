import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { FieldLabel, Header, InfoNote, PrimaryButton, Screen, ScreenScroll, SecondaryButton, TextField } from '@/design-system';
import { userMessageOf } from '@/domain/errors';
import { saveLinkRecipe } from '@/features/recipes/recipe-service';
import { normalizeRecipeUrl } from '@/features/recipes/recipe-source-links';
import { parseRecipeText } from '@/features/recipes/recipe-text-parser';
import { useAppState, useDb } from '@/hooks/app-state';
import { notify } from '@/utils/dialogs';

export default function ImportLinkScreen() {
  const db = useDb();
  const router = useRouter();
  const { settings, refresh } = useAppState();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [body, setBody] = useState('');

  /** 붙여넣은 글을 기기 안에서 정리해 편집기로 넘긴다. 원문은 저장하지 않는다. */
  const organize = () => {
    const parsed = parseRecipeText(body);
    if (parsed.ingredients.length === 0 && parsed.steps.length === 0) {
      notify('재료나 조리 순서를 찾지 못했어요', '"재료", "만드는 법" 같은 제목이나 "계란 2개" 형식이 있으면 더 잘 정리돼요.');
      return;
    }
    let sourceUrl: string | undefined;
    try {
      sourceUrl = url.trim() ? normalizeRecipeUrl(url) : undefined;
    } catch (error) {
      notify(userMessageOf(error));
      return;
    }
    const draft = { ...parsed, title: title.trim() || parsed.title, sourceUrl };
    router.push({ pathname: '/recipes/new', params: { draft: JSON.stringify(draft) } });
  };

  const save = async () => {
    try {
      const recipe = await saveLinkRecipe(db, { url, title, note, tags }, settings.defaultServings);
      refresh();
      router.replace({ pathname: '/recipes/[id]', params: { id: recipe.id } });
    } catch (error) {
      notify(userMessageOf(error));
    }
  };

  return (
    <Screen>
      <Header title="링크 저장" />
      <ScreenScroll footer={body.trim() ? <PrimaryButton label="재료·순서 정리하기" onPress={organize} /> : <PrimaryButton label="링크 저장" onPress={save} />}>
        <FieldLabel>원본 링크</FieldLabel>
        <TextField value={url} onChangeText={setUrl} placeholder="https://" autoCapitalize="none" keyboardType="url" />
        <View style={{ marginTop: 8 }}>
          <SecondaryButton
            label="클립보드에서 붙여넣기"
            onPress={async () => {
              const text = await Clipboard.getStringAsync();
              if (text) setUrl(text.trim());
            }}
          />
        </View>
        <FieldLabel>레시피 글 붙여넣기 (선택)</FieldLabel>
        <TextField value={body} onChangeText={setBody} placeholder={'블로그 본문이나 영상 설명란의 재료·만드는 법을 복사해 붙여넣으세요.\n예) 재료: 계란 2개, 대파 1대\n1. 대파를 썰어요.'} multiline label="레시피 글" style={{ minHeight: 160 }} />
        <View style={{ marginTop: 8 }}>
          <SecondaryButton
            label="클립보드의 글 붙여넣기"
            onPress={async () => {
              const text = await Clipboard.getStringAsync();
              if (text) setBody(text);
            }}
          />
        </View>
        <InfoNote>붙여넣은 글은 이 기기 안에서만 재료와 순서로 나누고, 원문은 저장하지 않아요. 링크 속 영상이나 페이지는 열지 않아요.</InfoNote>
        <FieldLabel>내가 쓰는 제목</FieldLabel>
        <TextField value={title} onChangeText={setTitle} placeholder="예: 엄마 스타일 제육볶음" />
        <FieldLabel>태그 (선택)</FieldLabel>
        <TextField value={tags} onChangeText={setTags} placeholder="예: 찌개, 주말" />
        <FieldLabel>내 메모 (선택)</FieldLabel>
        <TextField value={note} onChangeText={setNote} placeholder="다음에 바꿔 볼 점" multiline />
        <InfoNote>링크와 직접 쓴 내용만 저장해요. 원본 페이지의 글·사진·영상은 가져오지 않고, 저장할 때 해당 사이트에 접속하지 않아요.</InfoNote>
      </ScreenScroll>
    </Screen>
  );
}
