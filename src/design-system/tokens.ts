/** UX 보드(docs/design/ux-board.webp)에서 뽑은 값. 보드 폰 폭 268pt를 375pt로 환산했다. */
export interface Colors {
  background: string;
  surface: string;
  surfaceSoft: string;
  ink: string;
  sub: string;
  hint: string;
  line: string;
  green: string;
  greenDark: string;
  greenSoft: string;
  primary: string;
  onPrimary: string;
  alertBg: string;
  alertText: string;
  alertIcon: string;
  soonBg: string;
  soonText: string;
  neutralBg: string;
  neutralText: string;
  personalBg: string;
  personalText: string;
  expiredBg: string;
  expiredText: string;
  overlay: string;
  shadow: string;
  /** 배경을 지운 보드 이미지의 받침. 어두운 화면에서 흰 잔상이 보이지 않게 한다. */
  imagePlate: string;
}

export const lightColors: Colors = {
  background: '#F9F7F4',
  surface: '#FFFFFF',
  surfaceSoft: '#FDFCFA',
  ink: '#2B2B2B',
  sub: '#85827D',
  hint: '#A8A5A0',
  line: '#ECE9E4',
  green: '#5EA84F',
  greenDark: '#3F7F33',
  greenSoft: '#E7F2DF',
  primary: '#2F2F2F',
  onPrimary: '#FFFFFF',
  alertBg: '#FDEBE6',
  alertText: '#C5402E',
  alertIcon: '#F4735C',
  soonBg: '#FCE9B8',
  soonText: '#B85A10',
  neutralBg: '#EFEDEA',
  neutralText: '#66635E',
  personalBg: '#E7F2DF',
  personalText: '#3F7F33',
  expiredBg: '#F8D9D2',
  expiredText: '#A62F1F',
  overlay: 'rgba(30,28,25,0.45)',
  shadow: '#7C7264',
  imagePlate: 'transparent',
};

export const darkColors: Colors = {
  background: '#171614',
  surface: '#23211E',
  surfaceSoft: '#1F1D1B',
  ink: '#F2F0EC',
  sub: '#ADA9A2',
  hint: '#8C8882',
  line: '#35322E',
  green: '#7DBE69',
  greenDark: '#9AD187',
  greenSoft: '#2A3A24',
  primary: '#F2F0EC',
  onPrimary: '#201E1C',
  alertBg: '#3A2420',
  alertText: '#FF9D8C',
  alertIcon: '#F4735C',
  soonBg: '#40331A',
  soonText: '#F5C871',
  neutralBg: '#35322E',
  neutralText: '#CFCBC4',
  personalBg: '#2A3A24',
  personalText: '#A8DB95',
  expiredBg: '#4A241E',
  expiredText: '#FFB3A6',
  overlay: 'rgba(0,0,0,0.6)',
  shadow: '#000000',
  imagePlate: '#F5F2EC',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
export const radius = { sm: 10, md: 16, lg: 20, xl: 24, pill: 999 } as const;
export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;
