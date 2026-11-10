import { router } from 'expo-router';

/** 쌓인 화면(등록·상세·수정)을 모두 닫고 냉장고 목록 탭으로 이동한다. */
export function goToInventoryList(): void {
  if (router.canDismiss()) router.dismissAll();
  router.navigate('/inventory');
}
