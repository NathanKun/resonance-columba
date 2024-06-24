import { Formula } from "@/data/Formulas";
import { Typography } from "@mui/material";
import Image from "next/image";
import { Fragment } from "react";
import FatigueIcon from "../icons/FatigueIcon";
import 冷凝核心Src from "/public/engine-cores/冷凝核心.png";
import 混响核心Src from "/public/engine-cores/混响核心.png";
import 熔炉核心Src from "/public/engine-cores/熔炉核心.png";
import 负能核心Src from "/public/engine-cores/负能核心.png";
import 超载核心Src from "/public/engine-cores/超载核心.png";

export interface FormulaOfLevelHeadProps {
  formulaOfLevel: Formula;
  formulaOfLevelIndex: number;
  produceName: string;
}

export default function FormulaOfLevelHead(props: FormulaOfLevelHeadProps) {
  const { formulaOfLevel, formulaOfLevelIndex, produceName } = props;
  const cores = ["超载核心", "熔炉核心", "冷凝核心", "负能核心", "混响核心"] as const;
  const coreSrcs = {
    超载核心: 超载核心Src,
    熔炉核心: 熔炉核心Src,
    冷凝核心: 冷凝核心Src,
    负能核心: 负能核心Src,
    混响核心: 混响核心Src,
  };

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
          const key = `${produceName}-${formulaOfLevelIndex}-core-${core}`;
          if (condition > 1) {
            return (
              <Fragment key={key}>
                <Image src={coreSrcs[core]} alt={core} width={24} height={24} className="align-middle" />
                <span className="align-middle pl-1 pr-2">Lv{condition}</span>
              </Fragment>
            );
          }
          return <Fragment key={key}></Fragment>;
        })}
      </span>
    </Typography>
  );
}
