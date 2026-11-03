import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useColors } from '../theme';

/** 보드의 라인 아이콘을 벡터로 다시 그렸다(라이선스 의존 없음). */
export type IconName =
  | 'back' | 'chevron' | 'search' | 'bell' | 'plus' | 'minus' | 'scan' | 'calendar' | 'clock' | 'people' | 'timer' | 'level'
  | 'bookmark' | 'bookmark-filled' | 'dots' | 'dots-vertical' | 'snow' | 'fridge-door' | 'pantry' | 'camera' | 'image' | 'link'
  | 'check' | 'close' | 'alert' | 'note' | 'home' | 'home-filled' | 'fridge' | 'fridge-filled' | 'recipe' | 'chef-filled' | 'more' | 'more-filled'
  | 'filter' | 'leaf' | 'info' | 'trash' | 'external';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color, strokeWidth = 1.8 }: Props) {
  const c = useColors();
  const stroke = color ?? c.ink;
  const line = { stroke, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const solid = { fill: stroke };
  let body;
  switch (name) {
    case 'back':
      body = <Path d="M15 5l-7 7 7 7" {...line} strokeWidth={strokeWidth + 0.4} />;
      break;
    case 'chevron':
      body = <Path d="M9 5l7 7-7 7" {...line} />;
      break;
    case 'search':
      body = (
        <>
          <Circle cx={11} cy={11} r={7} {...line} />
          <Path d="M16.5 16.5L21 21" {...line} />
        </>
      );
      break;
    case 'bell':
      body = (
        <>
          <Path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15L6 16.5z" {...line} />
          <Path d="M10 20.5a2 2 0 004 0M12 3v2" {...line} />
        </>
      );
      break;
    case 'plus':
      body = <Path d="M12 5v14M5 12h14" {...line} />;
      break;
    case 'minus':
      body = <Path d="M5 12h14" {...line} />;
      break;
    case 'scan':
      body = (
        <>
          <Path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" {...line} />
          <Path d="M4 12h16" {...line} />
        </>
      );
      break;
    case 'calendar':
      body = (
        <>
          <Rect x={4} y={5.5} width={16} height={15} rx={3} {...line} />
          <Path d="M4 10.5h16M8.5 3.5v4M15.5 3.5v4" {...line} />
        </>
      );
      break;
    case 'clock':
    case 'timer':
      body = (
        <>
          <Circle cx={12} cy={12} r={8.5} {...line} />
          <Path d="M12 7.5V12l3 2" {...line} />
        </>
      );
      break;
    case 'people':
      body = (
        <>
          <Circle cx={12} cy={8.5} r={4} {...line} />
          <Path d="M4.5 20c.8-3.8 3.8-5.5 7.5-5.5s6.7 1.7 7.5 5.5" {...line} />
        </>
      );
      break;
    case 'level':
      body = <Path d="M12 4v16M6 8c0 3 3 4 6 4s6-1 6-4M7 16h10" {...line} />;
      break;
    case 'bookmark':
      body = <Path d="M6.5 4h11v16.5L12 16.5l-5.5 4V4z" {...line} />;
      break;
    case 'bookmark-filled':
      body = <Path d="M6.5 4h11v16.5L12 16.5l-5.5 4V4z" {...line} fill={stroke} />;
      break;
    case 'dots':
      body = (
        <>
          <Circle cx={6} cy={12} r={1.6} {...solid} />
          <Circle cx={12} cy={12} r={1.6} {...solid} />
          <Circle cx={18} cy={12} r={1.6} {...solid} />
        </>
      );
      break;
    case 'dots-vertical':
      body = (
        <>
          <Circle cx={12} cy={6} r={1.6} {...solid} />
          <Circle cx={12} cy={12} r={1.6} {...solid} />
          <Circle cx={12} cy={18} r={1.6} {...solid} />
        </>
      );
      break;
    case 'snow':
      body = <Path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M12 6.5L9.5 4.5M12 6.5l2.5-2M12 17.5l-2.5 2M12 17.5l2.5 2" {...line} />;
      break;
    case 'fridge-door':
      body = <Path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" {...line} />;
      break;
    case 'pantry':
      body = (
        <>
          <Path d="M9 21h8.5a1.5 1.5 0 001.5-1.5V12a2 2 0 00-2-2h-3l.6-3.6A1.8 1.8 0 0012.8 4L9 10v11z" {...line} />
          <Path d="M5 11v10" {...line} />
        </>
      );
      break;
    case 'camera':
      body = (
        <>
          <Path d="M4 8.5A1.5 1.5 0 015.5 7H8l1.5-2.5h5L16 7h2.5A1.5 1.5 0 0120 8.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5v-9z" {...line} />
          <Circle cx={12} cy={13} r={3.5} {...line} />
        </>
      );
      break;
    case 'image':
      body = (
        <>
          <Rect x={3.5} y={5} width={17} height={14} rx={2.5} {...line} />
          <Circle cx={9} cy={10} r={1.5} {...line} />
          <Path d="M4 17l5-4 3.5 2.5L16 12l4 4" {...line} />
        </>
      );
      break;
    case 'link':
      body = <Path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" {...line} />;
      break;
    case 'check':
      body = <Path d="M5 12.5l4.5 4.5L19 7.5" {...line} />;
      break;
    case 'close':
      body = <Path d="M6 6l12 12M18 6L6 18" {...line} />;
      break;
    case 'alert':
      body = (
        <>
          <Path d="M12 4l9 16H3l9-16z" {...line} />
          <Path d="M12 10v4.5M12 17.2v.1" {...line} />
        </>
      );
      break;
    case 'info':
      body = (
        <>
          <Circle cx={12} cy={12} r={8.5} {...line} />
          <Path d="M12 11v5M12 8v.1" {...line} />
        </>
      );
      break;
    case 'note':
      body = <Path d="M6 4h9l4 4v12H6V4zM15 4v4h4M9 13h6M9 16.5h4" {...line} />;
      break;
    case 'home':
      body = <Path d="M4 11l8-7 8 7v8.5a1 1 0 01-1 1h-4.5V15h-5v5.5H5a1 1 0 01-1-1V11z" {...line} />;
      break;
    case 'home-filled':
      body = <Path d="M4 11l8-7 8 7v8.5a1 1 0 01-1 1h-4.5V15h-5v5.5H5a1 1 0 01-1-1V11z" {...line} fill={stroke} />;
      break;
    case 'fridge':
    case 'fridge-filled':
      body = (
        <>
          <Rect x={5.5} y={3} width={13} height={18} rx={3} {...line} fill={name === 'fridge-filled' ? stroke : 'none'} />
          <Path d="M5.5 10.5h13M9 6.2v1.8M9 13v2.5" {...line} stroke={name === 'fridge-filled' ? c.background : stroke} />
        </>
      );
      break;
    case 'recipe':
      body = (
        <>
          <Rect x={4.5} y={7.5} width={15} height={13} rx={2} {...line} />
          <Path d="M9 7.5V5a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0115 5v2.5M9.5 7.5v13M14.5 7.5v13" {...line} />
        </>
      );
      break;
    case 'chef-filled':
      body = (
        <>
          <Path d="M7 16.5v-2.8A4 4 0 016.5 6a5.8 5.8 0 0111 0 4 4 0 01-.5 7.7v2.8H7z" fill={stroke} />
          <Path d="M7 18.3h10V20a.8.8 0 01-.8.8H7.8A.8.8 0 017 20v-1.7z" fill={stroke} />
        </>
      );
      break;
    case 'more':
    case 'more-filled':
      body = (
        <>
          <Rect x={4.5} y={5} width={15} height={6} rx={3} {...line} fill={name === 'more-filled' ? stroke : 'none'} />
          <Rect x={4.5} y={13} width={15} height={6} rx={3} {...line} fill={name === 'more-filled' ? stroke : 'none'} />
        </>
      );
      break;
    case 'filter':
      body = <Path d="M4 6h16M7 12h10M10 18h4" {...line} />;
      break;
    case 'leaf':
      body = <Path d="M5 19C4 10 10 4 20 4c0 10-6 16-15 15zM5 19l8-8" {...line} />;
      break;
    case 'trash':
      body = <Path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 11v5.5M13.5 11v5.5" {...line} />;
      break;
    case 'external':
      body = <Path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" {...line} />;
      break;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}

/** 보드의 앱 로고(냉장고 + 잎) */
export function LogoMark({ size = 30 }: { size?: number }) {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Rect x={222} y={210} width={340} height={604} rx={92} fill="none" stroke={c.ink} strokeWidth={52} />
      <Path d="M222 482h340" stroke={c.ink} strokeWidth={52} />
      <Path d="M322 310v92M322 566v92" stroke={c.ink} strokeWidth={52} strokeLinecap="round" />
      <Path d="M620 330c-30-110 40-200 180-226 20 130-50 226-180 226z" fill={c.green} />
      <Path d="M614 416c70-80 170-90 262-30-60 90-190 110-262 30z" fill={c.green} />
    </Svg>
  );
}

/** 냉장고 현황 카드 아이콘 3종(보드의 잎 · 반찬통 · 우유팩) */
export function GroupIcon({ group, size = 38 }: { group: 'FRESH' | 'SIDE' | 'PROCESSED'; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {group === 'FRESH' && (
        <>
          <Path d="M8 32C6 16 16 6 34 6c1 17-9 28-26 26z" fill="#79B868" />
          <Path d="M9 31L25 15M16 24v-6M16 24h7" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </>
      )}
      {group === 'SIDE' && (
        <>
          <Rect x={12} y={4} width={16} height={6} rx={2} fill="#F3B15C" />
          <Rect x={8} y={9} width={24} height={27} rx={6} fill="#F08C2E" />
          <Rect x={14} y={17} width={12} height={8} rx={4} fill="#FFF3E2" />
        </>
      )}
      {group === 'PROCESSED' && (
        <>
          <Path d="M11 15l5-9h8l5 9H11z" fill="#CFE0F2" />
          <Rect x={11} y={15} width={18} height={21} rx={1.5} fill="#A9CBEA" />
          <Rect x={15} y={22} width={3} height={3} rx={1} fill="#fff" />
        </>
      )}
    </Svg>
  );
}
