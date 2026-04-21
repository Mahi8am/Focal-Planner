import { SlotId } from '../types';

export const SLOTS: { id: SlotId; label: string; timeRange: string }[] = [
  { id: 'morning',   label: 'MORNING',   timeRange: '6AM – 12PM' },
  { id: 'afternoon', label: 'AFTERNOON', timeRange: '12PM – 6PM' },
  { id: 'evening',   label: 'EVENING',   timeRange: '6PM – 12AM' },
];

export type ColorTheme = 'royal' | 'phantom' | 'velvet' | 'azure' | 'emerald' | 'crimson' | 'sakura' | 'purple' | 'navy' |'charcoal' | 'dandelion' | 'fire' | 'cherry' | 'wine' | 'dyedBlue' ;
export const THEMES: Record<ColorTheme, { name: string; accent: string; accentDark: string }> = {
  azure:     { name: 'AZURE BLADE',    accent: '#4C8CE4', accentDark: '#0040AA' },
  dyedBlue:  { name: 'DYED BLUE',      accent: '#6367FF', accentDark: '#4c4e97' },
  navy:      { name: 'NAVY BLUE',      accent: '#3d5064', accentDark: '#2C3947' },
  charcoal:  { name: 'CHARCOAL BLUE',  accent: '#2D4059', accentDark: '#2C3947' },
  emerald:   { name: 'EMERALD GHOST',  accent: '#2FA084', accentDark: '#007A47' },
  phantom:   { name: 'PHANTOM GOLD',   accent: '#D4A017', accentDark: '#8B6800' },
  dandelion: { name: 'DANDELION',      accent: '#FFD460', accentDark: '#d8b043' },
  sakura:    { name: 'SAKURA BLOOM',   accent: '#FF6B9D', accentDark: '#C0396A' },
  velvet:    { name: 'VELVET VIOLET',  accent: '#982598', accentDark: '#5A1A85' },
  purple:    { name: 'BLACK PEARL',    accent: '#635985', accentDark: '#423861' },
  cherry:    { name: 'BERRY RED',      accent: '#5D0E41', accentDark: '#440f31' },
  wine:      { name: 'WINE GLASS',     accent: '#A0153E', accentDark: '#74253c' },
  fire:      { name: 'FIRE RED',       accent: '#EA5455', accentDark: '#c44444' },
  crimson:   { name: 'CRIMSON STEEL',  accent: '#FF4444', accentDark: '#AA0000' },
  royal:     { name: 'ROYAL RED',      accent: '#E8002A', accentDark: '#A30020' },
};

export type CompletedColor = 'green' | 'teal' | 'lime' | 'sky' | 'orange' | 'washed' | 'dandelion' | 'salmon' | 'glass';
export const COMPLETED_COLORS: Record<CompletedColor, { name: string; hex: string; glow: string }> = {
  glass:     { name: 'GLASS BLUE',    hex: '#BBDCE5', glow: 'rgba(187, 220, 229, 0.15)' },
  sky:       { name: 'SKY BLUE',      hex: '#3498DB', glow: 'rgba(52,152,219,0.15)'     },
  washed:    { name: 'WASHED BLUE',   hex: '#547A95', glow: 'rgba(36, 122, 161, 0.15)'  },
  teal:      { name: 'TEAL WAVE',     hex: '#1ABC9C', glow: 'rgba(26,188,156,0.15)'     },
  green:     { name: 'LEAF GREEN',    hex: '#2ECC71', glow: 'rgba(46,204,113,0.15)'     },
  lime:      { name: 'ELECTRIC LIME', hex: '#A8E063', glow: 'rgba(168,224,99,0.15)'     },
  dandelion: { name: 'DANDELION',     hex: '#FFD460', glow: 'rgba(255, 212, 96, 0.15)'  },
  orange:    { name: 'EMBER ORANGE',  hex: '#E67E22', glow: 'rgba(230,126,34,0.15)'     },
  salmon:    { name: 'SUNNY SIDE',    hex: '#FF9A86', glow: 'rgba(227, 106, 106, 0.15)' },
};

export type FailedColor = 'crimsonRed' | 'deepRed' | 'burntOrange' | 'warnYellow' | 'hotPink' | 'sand' | 'fire' | 'brown';
export const FAILED_COLORS: Record<FailedColor, { name: string; hex: string; glow: string }> = {
  sand:        { name: 'IRON SAND',      hex: '#C2A56D', glow: 'rgba(194,165,109,0.15)' },
  brown:       { name: 'LEATHER BROWN',  hex: '#715A5A', glow: 'rgba(113, 90, 90,0.15)' },
  warnYellow:  { name: 'WARNING AMBER',  hex: '#F9A825', glow: 'rgba(249,168,37,0.15)'  },
  burntOrange: { name: 'BURNT ORANGE',   hex: '#E64A19', glow: 'rgba(230,74,25,0.15)'   },
  hotPink:     { name: 'NEON ROSE',      hex: '#D81B60', glow: 'rgba(216,27,96,0.15)'   },
  fire:        { name: 'FIRE RED',       hex: '#EA5455', glow: 'rgba(234, 84, 85,0.15)' },
  crimsonRed:  { name: 'CRIMSON RED',    hex: '#E53935', glow: 'rgba(229,57,53,0.15)'   },
  deepRed:     { name: 'DEEP RED',       hex: '#B71C1C', glow: 'rgba(183,28,28,0.15)'   },
};

export function buildColors(isDark: boolean, accentHex: string, accentDarkHex: string, completedHex: string, completedGlow: string, failedHex: string, failedGlow: string) {
  if (isDark) {
    return {
      red: accentHex, redDark: accentDarkHex,
      redDeep: `${accentHex}22`, redGlow: `${accentHex}28`,
      bg: '#181818', bgCard: '#232323', bgElevated: '#2C2C2C', bgAccent: '#282828',
      white: '#FFFFFF', whiteOff: '#F0F0F0', whiteDim: '#BBBBBB',
      grey: '#3A3A3A', greyLight: '#666666',
      completed: completedHex, completedDark: '#1A5C38', completedGlow,
      failed: failedHex, failedGlow,
      text: '#FFFFFF', textSub: '#BBBBBB', textMuted: '#777777',
      border: '#333333', shadow: 'rgba(0,0,0,0.6)', accent: accentHex,
      isDark: true,
    };
  }
  return {
    red: accentHex, redDark: accentDarkHex,
    redDeep: `${accentHex}18`, redGlow: `${accentHex}15`,
    bg: '#F2EDED', bgCard: '#FFFFFF', bgElevated: '#EDE8E8', bgAccent: '#F7F2F2',
    white: '#1A1A1A', whiteOff: '#2A2A2A', whiteDim: '#555555',
    grey: '#DDDDDD', greyLight: '#AAAAAA',
    completed: completedHex, completedDark: '#D4F5E3', completedGlow,
    failed: failedHex, failedGlow,
    text: '#1A1A1A', textSub: '#555555', textMuted: '#999999',
    border: '#E0D5D5', shadow: 'rgba(0,0,0,0.1)', accent: accentHex,
    isDark: false,
  };
}

export type Colors = ReturnType<typeof buildColors>;

export const STORAGE_KEY         = '@focal_planner_v1';
export const THEME_KEY           = '@focal_planner_theme';
export const COLOR_THEME_KEY     = '@focal_planner_color';
export const COMPLETED_COLOR_KEY = '@focal_planner_completed_color';
export const FAILED_COLOR_KEY    = '@focal_planner_failed_color';
export const INSTALL_DATE_KEY    = '@focal_planner_install_date';
export const ONBOARDING_KEY      = '@focal_planner_onboarded';

export const DAILY_QUOTES = [
  'Every moment is a chance to act.',
  'The past is written. The future is yours.',
  'Plan well. Execute with purpose.',
  'Small steps compound into great journeys.',
  'Discipline is freedom.',
  'Be the protagonist of your own story.',
  'Clarity of purpose beats intensity of effort.',
  'You do not rise to your goals. You fall to your systems.',
  'One task at a time. That is enough.',
  'Show up. That is half the battle.',
  'Be Intentional.',
];

export const FUNNY_QUOTES = [
  'Even heroes need a day off.',
  'Rumor says this task completes itself.',
  'Your potential is showing. Tuck it in.',
  'One day or day one. Choose wisely... or don\'t.',
  'Somehow still going. Respect.',
  'The protagonist energy is real today.',
  'Rest is also part of the grind.',
  'Bold of you to plan while avoiding planning.',
  'History remembers those who wrote things down.',
  'You\'re not procrastinating. You\'re marinating.',
  'A villain would\'ve finished by now. Just saying.',
  'Three tasks. Infinite excuses. You choose.',
  'Goals don\'t care about your feelings. Do it anyway.',
  'Today\'s suffering is tomorrow\'s character arc.',
];

export const SPAM_RESPONSES = [
  'STOP. Please.',
  'That tickles, you know.',
  'I am not a stress ball!',
  'One more tap and I file a complaint.',
  'You have a tapping problem.',
  'My therapist said I should set limits.',
  'I\'m going to start charging per tap.',
  'This is assault on a quote card.',
  'Have you considered touching grass?',
  'The tapping... it never ends.',
  'I am begging you. Stop.',
  'Fine. I\'ll just sit here.',
  'At this point I\'m just numb.',
  'Congratulations. You broke me.',
];

export const ABOUT_SPAM_RESPONSES = [
  'Focal Planner: now sentient, send help.',
  'v1.0 — still cheaper than therapy.',
  'Made with love, broken by you.',
  'About: It\'s a planner. You know this.',
  'Focal Planner: the app that fights back.',
  'Tap us one more time. We dare you.',
  'Certified tap-proof. Clearly a lie.',
];

export const FUNNY_NAMES: { title: string; sub: string }[] = [
  { title: 'CHAOS',   sub: 'ENGINE'   },
  { title: 'TAP',     sub: 'MONSTER'  },
  { title: 'GOBLIN',  sub: 'MODE'     },
  { title: 'BROKEN',  sub: 'APP'      },
  { title: 'HELP',    sub: 'ME'       },
  { title: 'CURSED',  sub: 'PLANNER'  },
  { title: 'STOP',    sub: 'TAPPING'  },
  { title: 'SEND',    sub: 'HELP'     },
];
