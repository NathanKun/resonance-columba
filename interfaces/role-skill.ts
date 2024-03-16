export interface ResonanceSkill {
  buyMore: {
    product?: {
      [pdtName: string]: number; // percentage, example: 10
    };
    city?: {
      [cityName: string]: number;
    };
  };
}

export interface ResonanceSkills {
  [resonance: number]: ResonanceSkill;
}
