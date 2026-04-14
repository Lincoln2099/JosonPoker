export const springTheme = {
  field:       '#2d8a4e',
  fieldLight:  '#3da760',
  fieldDark:   '#1e6b38',
  chalk:       '#ffffff',
  chalkFaded:  'rgba(255,255,255,0.15)',
  sakura:      '#ffb7c5',
  sky:         '#87ceeb',
  sunlight:    '#ffd700',
  win:         '#4ade80',
  lose:        '#f87171',
  gold:        '#fbbf24',
  cardWhite:   '#fefefe',
  suitRed:     '#dc2626',
  suitBlack:   '#1e293b',
  bgDeep:      '#0f1923',
  bgMid:       '#1a2e1a',
} as const;

export type ThemeColor = keyof typeof springTheme;
