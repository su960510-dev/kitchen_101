import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { takeDraft } from '@/features/recipes/draft-store';
import { RecipeEditor } from '@/features/recipes/RecipeEditor';

export default function NewRecipeScreen() {
  const { draftId } = useLocalSearchParams<{ draftId?: string }>();
  // 첫 화면 그리기 때 한 번만 읽는다. 편집 중 다시 그려져도 사용자가 고친 내용이 초기화되지 않는다.
  const [draft] = useState(() => takeDraft(draftId));
  return <RecipeEditor key={draftId ?? 'new'} draft={draft} />;
}
