// Academy Hub - Theme Configuration

export const COLORS = {
  primary: {
    50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC', 400: '#818CF8',
    500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81',
  },
  secondary: {
    50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4', 400: '#2DD4BF',
    500: '#14B8A6', 600: '#0D9488', 700: '#0F766E', 800: '#115E59', 900: '#134E4A',
  },
  accent: {
    50: '#FFF1F2', 100: '#FFE4E6', 200: '#FECDD3', 300: '#FDA4AF', 400: '#FB7185',
    500: '#F43F5E', 600: '#E11D48', 700: '#BE123C', 800: '#9F1239', 900: '#881337',
  },
  success: {
    50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC', 400: '#4ADE80',
    500: '#22C55E', 600: '#16A34A', 700: '#15803D', 800: '#166534', 900: '#14532D',
  },
  warning: {
    50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24',
    500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F',
  },
  error: {
    50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5', 400: '#F87171',
    500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D',
  },
  neutral: {
    0: '#FFFFFF', 50: '#FAFAFA', 100: '#F4F4F5', 200: '#E4E4E7', 300: '#D4D4D8',
    400: '#A1A1AA', 500: '#71717A', 600: '#52525B', 700: '#3F3F46', 800: '#27272A',
    900: '#18181B', 950: '#09090B',
  },

  background: { primary: '#FFFFFF', secondary: '#FAFAFA', tertiary: '#F4F4F5', inverse: '#18181B' },
  text: { primary: '#18181B', secondary: '#52525B', tertiary: '#71717A', inverse: '#FFFFFF', link: '#6366F1' },
  border: { light: '#E4E4E7', medium: '#D4D4D8', dark: '#A1A1AA' },
  category: { general: '#6366F1', question: '#F59E0B', studyGroup: '#10B981', event: '#EC4899', resource: '#8B5CF6', marketplace: '#06B6D4', housing: '#F97316', jobs: '#14B8A6' },
  social: { like: '#EF4444', likeActive: '#DC2626', comment: '#6366F1', share: '#10B981', bookmark: '#F59E0B' },
  status: { online: '#22C55E', offline: '#A1A1AA', busy: '#EF4444', away: '#F59E0B' },
  badge: { verified: '#6366F1', student: '#10B981', faculty: '#8B5CF6', alumni: '#F59E0B' },
} as const;

export const DARK_COLORS = {
  ...COLORS,
  background: { primary: '#09090B', secondary: '#18181B', tertiary: '#27272A', inverse: '#FFFFFF' },
  text: { primary: '#FAFAFA', secondary: '#A1A1AA', tertiary: '#71717A', inverse: '#18181B', link: '#818CF8' },
  border: { light: '#27272A', medium: '#3F3F46', dark: '#52525B' },
} as const;

export const TYPOGRAPHY = {
  fontFamily: { regular: 'System', medium: 'System', semibold: 'System', bold: 'System' },
  fontSize: { xs: 10, sm: 12, base: 14, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48 },
  lineHeight: { none: 1, tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 },
  fontWeight: { normal: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const },
  letterSpacing: { tighter: -0.5, tight: -0.25, normal: 0, wide: 0.25, wider: 0.5, widest: 1 },
} as const;

export const TEXT_STYLES = {
  h1: { fontSize: TYPOGRAPHY.fontSize['4xl'], fontWeight: TYPOGRAPHY.fontWeight.bold, lineHeight: TYPOGRAPHY.lineHeight.tight },
  h2: { fontSize: TYPOGRAPHY.fontSize['3xl'], fontWeight: TYPOGRAPHY.fontWeight.bold, lineHeight: TYPOGRAPHY.lineHeight.tight },
  h3: { fontSize: TYPOGRAPHY.fontSize['2xl'], fontWeight: TYPOGRAPHY.fontWeight.semibold, lineHeight: TYPOGRAPHY.lineHeight.snug },
  h4: { fontSize: TYPOGRAPHY.fontSize.xl, fontWeight: TYPOGRAPHY.fontWeight.semibold, lineHeight: TYPOGRAPHY.lineHeight.snug },
  h5: { fontSize: TYPOGRAPHY.fontSize.lg, fontWeight: TYPOGRAPHY.fontWeight.medium, lineHeight: TYPOGRAPHY.lineHeight.normal },
  bodyLarge: { fontSize: TYPOGRAPHY.fontSize.md, fontWeight: TYPOGRAPHY.fontWeight.normal, lineHeight: TYPOGRAPHY.lineHeight.relaxed },
  body: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.normal, lineHeight: TYPOGRAPHY.lineHeight.normal },
  bodySmall: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.normal, lineHeight: TYPOGRAPHY.lineHeight.normal },
  label: { fontSize: TYPOGRAPHY.fontSize.sm, fontWeight: TYPOGRAPHY.fontWeight.medium, lineHeight: TYPOGRAPHY.lineHeight.none },
  labelSmall: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.medium, lineHeight: TYPOGRAPHY.lineHeight.none, letterSpacing: TYPOGRAPHY.letterSpacing.wide },
  button: { fontSize: TYPOGRAPHY.fontSize.base, fontWeight: TYPOGRAPHY.fontWeight.semibold, lineHeight: TYPOGRAPHY.lineHeight.none },
  caption: { fontSize: TYPOGRAPHY.fontSize.xs, fontWeight: TYPOGRAPHY.fontWeight.normal, lineHeight: TYPOGRAPHY.lineHeight.normal },
} as const;

export const SPACING = {
  0: 0, px: 1, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14, 4: 16, 5: 20,
  6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96,
} as const;

export const LAYOUT = {
  screenPaddingHorizontal: SPACING[4],
  screenPaddingVertical: SPACING[4],
  cardPadding: SPACING[4],
  cardMargin: SPACING[3],
  cardBorderRadius: SPACING[3],
  listItemPadding: SPACING[4],
  listItemGap: SPACING[2],
  buttonPaddingHorizontal: SPACING[6],
  buttonPaddingVertical: SPACING[3],
  buttonBorderRadius: SPACING[2],
  inputPaddingHorizontal: SPACING[4],
  inputPaddingVertical: SPACING[3],
  inputBorderRadius: SPACING[2],
  avatarXS: SPACING[6],
  avatarSM: SPACING[8],
  avatarMD: SPACING[10],
  avatarLG: SPACING[12],
  avatarXL: SPACING[16],
  avatar2XL: SPACING[24],
  iconXS: 12,
  iconSM: 16,
  iconMD: 20,
  iconLG: 24,
  iconXL: 32,
  tabBarHeight: 60,
  tabBarIconSize: 24,
  headerHeight: 56,
  bottomSheetHandleHeight: 24,
  maxContentWidth: 600,
} as const;

export const BORDER_RADIUS = {
  none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 24, '3xl': 32, full: 9999,
} as const;

export const SHADOWS = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
} as const;

export const Z_INDEX = {
  base: 0, dropdown: 10, sticky: 20, fixed: 30, modalBackdrop: 40, modal: 50, popover: 60, tooltip: 70, toast: 80,
} as const;

export const GRADIENTS = {
  primary: ['#6366F1', '#4F46E5'],
  primaryLight: ['#818CF8', '#6366F1'],
  secondary: ['#14B8A6', '#0D9488'],
  accent: ['#F43F5E', '#E11D48'],
  backgroundSubtle: ['#FFFFFF', '#FAFAFA'],
  backgroundDark: ['#18181B', '#09090B'],
  sunset: ['#F43F5E', '#F59E0B'],
  ocean: ['#6366F1', '#14B8A6'],
  forest: ['#10B981', '#059669'],
  purple: ['#8B5CF6', '#6366F1'],
  cardHighlight: ['rgba(99, 102, 241, 0.1)', 'rgba(99, 102, 241, 0.05)'],
} as const;

export const TW = {
  bgPrimary: 'bg-indigo-500',
  bgSecondary: 'bg-teal-500',
  bgAccent: 'bg-rose-500',
  bgSurface: 'bg-white',
  bgMuted: 'bg-zinc-100',
  textPrimary: 'text-zinc-900',
  textSecondary: 'text-zinc-600',
  textMuted: 'text-zinc-400',
  textInverse: 'text-white',
  textLink: 'text-indigo-500',
  borderLight: 'border-zinc-200',
  borderMedium: 'border-zinc-300',
  card: 'bg-white rounded-xl p-4 shadow-sm border border-zinc-200',
  button: 'bg-indigo-500 rounded-lg px-6 py-3 items-center justify-center',
  buttonText: 'text-white font-semibold text-base',
  input: 'bg-zinc-100 rounded-lg px-4 py-3 text-zinc-900',
  avatar: 'rounded-full bg-zinc-200',
} as const;

export const THEME = {
  colors: COLORS,
  darkColors: DARK_COLORS,
  typography: TYPOGRAPHY,
  textStyles: TEXT_STYLES,
  spacing: SPACING,
  layout: LAYOUT,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  zIndex: Z_INDEX,
  gradients: GRADIENTS,
  tw: TW,
} as const;

export default THEME;
