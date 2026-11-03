import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { FieldLabel, Header, InfoNote, PrimaryButton, Screen, ScreenScroll, SecondaryButton, TextField } from '@/design-system';
import { userMessageOf } from '@/domain/errors';
import { saveLinkRecipe } from '@/features/recipes/recipe-service';
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
      <ScreenScroll footer={<PrimaryButton label="링크 저장" onPress={save} />}>
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
