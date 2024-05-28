import { Formula } from "@/data/Formulas";
import { Typography } from "@mui/material";
import Image from "next/image";
import { Fragment } from "react";
import FatigueIcon from "../icons/FatigueIcon";

export interface FormulaOfLevelHeadProps {
  formulaOfLevel: Formula;
  formulaOfLevelIndex: number;
  produceName: string;
}

export default function FormulaOfLevelHead(props: FormulaOfLevelHeadProps) {
  const { formulaOfLevel, formulaOfLevelIndex, produceName } = props;
  const cores = ["超载核心", "熔炉核心", "冷凝核心", "负能核心", "混响核心"] as const;

  return (
    <Typography>
      <span className="align-middle pr-4">{formulaOfLevel.formulaLevel}级</span>
      <span className="align-middle pr-4">
        <FatigueIcon className="align-middle mr-1" />
        <span className="align-middle">{formulaOfLevel.fatigue}</span>
      </span>
      <span>
        {cores.map((core) => {
          const condition = (formulaOfLevel.unlockCondition as any)[core] as number;
          if (condition > 1) {
            return (
              <Fragment key={`${produceName}-${formulaOfLevelIndex}-core-${core}`}>
                <Image src={`/engine-cores/${core}.png`} alt={core} width={24} height={24} className="align-middle" />
                <span className="align-middle pl-1 pr-2">Lv{condition}</span>
              </Fragment>
            );
          }
          return <></>;
        })}
      </span>
    </Typography>
  );
}
