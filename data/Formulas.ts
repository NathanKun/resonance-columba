import { FORMULAS as formulas } from "resonance-data-columba/dist/columbabuild";

export const FORMULAS = formulas;
export type Formula = (typeof formulas)[0][0];
