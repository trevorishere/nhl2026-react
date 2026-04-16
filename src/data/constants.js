// Team primary colors matched exactly to Figma frame 123:29
export const TEAM_STYLES = {
  COL: { bg: '#236192', overlay: 0     },
  LAK: { bg: '#111111', overlay: 0     },
  DAL: { bg: '#00843d', overlay: 0     },
  MIN: { bg: '#154734', overlay: 0     },
  EDM: { bg: '#cd4629', overlay: 0     },
  UTA: { bg: '#4484bb', overlay: 0     },
  ANA: { bg: '#cf4520', overlay: 0     },
  VGK: { bg: 'rgb(51,63,72)', overlay: 0.2 },
  TBL: { bg: '#013f84', overlay: 0     },
  BOS: { bg: '#010101', overlay: 0     },
  BUF: { bg: '#003087', overlay: 0     },
  MTL: { bg: '#a6192e', overlay: 0     },
  CAR: { bg: '#bf0018', overlay: 0     },
  OTT: { bg: '#80683f', overlay: 0     },
  PIT: { bg: '#010101', overlay: 0     },
  PHI: { bg: '#e54502', overlay: 0     },
};

export const SEEDS = {
  BUF: 'A1', TBL: 'A2', MTL: 'A3',
  CAR: 'M1', PIT: 'M2', PHI: 'M3',
  BOS: 'WC1', OTT: 'WC2',
  COL: 'C1', DAL: 'C2', MIN: 'C3',
  VGK: 'P1', EDM: 'P2', ANA: 'P3',
  LAK: 'WC2', UTA: 'WC1',
};

// Maps each matchup ID to the next round's matchup ID
export const ROUND_PROGRESSION = {
  E1: 'S1', E2: 'S1', E3: 'S2', E4: 'S2',
  W1: 'S3', W2: 'S3', W3: 'S4', W4: 'S4',
  S1: 'F1', S2: 'F1', S3: 'F2', S4: 'F2',
  F1: 'C1', F2: 'C1',
};

export const CHALK_PICKS = {
  E1: 'BUF', E2: 'TBL', E3: 'CAR', E4: 'PIT',
  W1: 'COL', W2: 'DAL', W3: 'VGK', W4: 'EDM',
  S1: 'TBL', S2: 'CAR', S3: 'COL', S4: 'EDM',
  F1: 'CAR', F2: 'COL', C1: 'COL',
};

export const ROUND1_MATCHUPS = [
  { id: 'E1', teams: ['BUF', 'BOS'], label: 'Atlantic 1' },
  { id: 'E2', teams: ['TBL', 'MTL'], label: 'Atlantic 2' },
  { id: 'E3', teams: ['CAR', 'OTT'], label: 'Metro 1' },
  { id: 'E4', teams: ['PIT', 'PHI'], label: 'Metro 2' },
  { id: 'W1', teams: ['COL', 'LAK'], label: 'Central 1' },
  { id: 'W2', teams: ['DAL', 'MIN'], label: 'Central 2' },
  { id: 'W3', teams: ['VGK', 'UTA'], label: 'Pacific 1' },
  { id: 'W4', teams: ['EDM', 'ANA'], label: 'Pacific 2' },
];

// Which downstream picks to clear when a pick changes
export const PICK_DEPS = {
  E1: ['S1', 'F1', 'C1'], E2: ['S1', 'F1', 'C1'],
  E3: ['S2', 'F1', 'C1'], E4: ['S2', 'F1', 'C1'],
  W1: ['S3', 'F2', 'C1'], W2: ['S3', 'F2', 'C1'],
  W3: ['S4', 'F2', 'C1'], W4: ['S4', 'F2', 'C1'],
  S1: ['F1', 'C1'], S2: ['F1', 'C1'],
  S3: ['F2', 'C1'], S4: ['F2', 'C1'],
  F1: ['C1'], F2: ['C1'], C1: [],
};
