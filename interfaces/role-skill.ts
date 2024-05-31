export interface ResonanceSkill {
  buyMore?: {
    product?: {
      [pdtName: string]: number; // percentage, example: 10
    };
    city?: {
      [cityName: string]: number;
    };
    all?: number; // + buy more for all products
  };
  bargain?: {
    firstTrySuccessRate?: number; // + success rate for first bargain try
    afterFailedSuccessRate?: number; // + success rate for after failed bargain try
    bargainCount?: number; // + number of bargain tries
    bargainSuccessRate?: number; // + success rate for bargain
    bargainRate?: number; // + bargain rate
    raiseCount?: number; // + number of raise tries
    raiseSuccessRate?: number; // + success rate for raise
    raiseRate?: number; // + raise rate
    afterFailedLessFatigue?: number; // - fatigue after failed bargain
  };
  // TODO: 隼 may have taxCut skill, implement it later
  taxCut?: {
    city?: {
      [cityName: string]: number;
    };
  };
  other?: {
    driveLessFatigue?: number; // - fatigue for driving
  };
}

export interface ResonanceSkills {
  [resonance: number]: ResonanceSkill;
}
