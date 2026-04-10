// Team primary colors + dark overlay amounts (from Figma)
export const TEAM_STYLES = {
  UTA: { bg: 'rgb(13,85,148)',   overlay: 0.26 },
  LAK: { bg: '#111111',          overlay: 0    },
  BUF: { bg: '#031f53',          overlay: 0    },
  CAR: { bg: 'rgb(205,0,26)',    overlay: 0.4  },
  EDM: { bg: 'rgb(207,69,32)',   overlay: 0.35 },
  VGK: { bg: 'rgb(51,63,72)',    overlay: 0.2  },
  MTL: { bg: 'rgb(166,25,46)',   overlay: 0.25 },
  OTT: { bg: '#2d2926',          overlay: 0    },
  COL: { bg: 'rgb(35,97,146)',   overlay: 0.2  },
  ANA: { bg: 'rgb(207,69,32)',   overlay: 0.3  },
  TBL: { bg: '#04356a',          overlay: 0    },
  PIT: { bg: '#010101',          overlay: 0    },
  DAL: { bg: 'rgb(0,132,61)',    overlay: 0.32 },
  MIN: { bg: 'rgb(21,71,52)',    overlay: 0.2  },
  BOS: { bg: '#010101',          overlay: 0    },
  PHI: { bg: 'rgb(252,76,2)',    overlay: 0.3  },
};

export const SEEDS = {
  TBL: 'A1', BUF: 'A2', MTL: 'A3',
  CAR: 'M1', PIT: 'M2', PHI: 'M3',
  BOS: 'WC1', OTT: 'WC2',
  COL: 'C1', DAL: 'C2', MIN: 'C3',
  EDM: 'P1', ANA: 'P2', VGK: 'P3',
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
  E1: 'TBL', E2: 'BUF', E3: 'CAR', E4: 'PIT',
  W1: 'COL', W2: 'DAL', W3: 'EDM', W4: 'ANA',
  S1: 'TBL', S2: 'CAR', S3: 'COL', S4: 'EDM',
  F1: 'CAR', F2: 'COL', C1: 'COL',
};

export const ROUND1_MATCHUPS = [
  { id: 'E1', teams: ['TBL', 'BOS'], label: 'Atlantic 1' },
  { id: 'E2', teams: ['BUF', 'MTL'], label: 'Atlantic 2' },
  { id: 'E3', teams: ['CAR', 'OTT'], label: 'Metro 1' },
  { id: 'E4', teams: ['PIT', 'PHI'], label: 'Metro 2' },
  { id: 'W1', teams: ['COL', 'LAK'], label: 'Central 1' },
  { id: 'W2', teams: ['DAL', 'MIN'], label: 'Central 2' },
  { id: 'W3', teams: ['EDM', 'UTA'], label: 'Pacific 1' },
  { id: 'W4', teams: ['ANA', 'VGK'], label: 'Pacific 2' },
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
