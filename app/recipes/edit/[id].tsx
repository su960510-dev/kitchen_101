import { useLocalSearchParams } from 'expo-router';

import { Header, Screen } from '@/design-system';
import { RecipeEditor } from '@/features/recipes/RecipeEditor';
import { recipeRepository } from '@/infrastructure/database/repositories/recipe-repository';
import { useDb } from '@/hooks/app-state';
import { useLoader } from '@/hooks/use-loader';

export default function EditRecipeScreen() {
  const db = useDb();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useLoader(() => recipeRepository.get(db, id), [id]);
  if (!data) {
    return (
      <Screen>
        <Header title="레시피 수정" />
      </Screen>
    );
  }
  return <RecipeEditor key={data.recipe.id} initial={data} />;
}
