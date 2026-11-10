import { useLocalSearchParams } from 'expo-router';

import { RecipeEditor, type RecipeDraft } from '@/features/recipes/RecipeEditor';

function readDraft(raw: string | undefined): RecipeDraft | undefined {
  if (!raw) return undefined;
  try {
    const draft = JSON.parse(raw) as RecipeDraft;
    return Array.isArray(draft.ingredients) && Array.isArray(draft.steps) ? draft : undefined;
  } catch {
    return undefined;
  }
}

export default function NewRecipeScreen() {
  const { draft } = useLocalSearchParams<{ draft?: string }>();
  return <RecipeEditor draft={readDraft(draft)} />;
}
