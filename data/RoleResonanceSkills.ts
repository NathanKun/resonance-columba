import { ResonanceSkills } from "@/interfaces/role-skill";

export const ROLE_RESONANCE_SKILLS: {
  [role: string]: ResonanceSkills;
} = {
  星花: {
    1: {
      buyMore: {
        product: {
          人工晶花: 20,
        },
      },
    },
  },
  卡洛琳: {
    4: {
      buyMore: {
        product: {
          石墨烯: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          石墨烯: 30,
        },
      },
    },
  },
  伊尔: {
    1: {
      buyMore: {
        product: {
          阿妮塔101民用无人机: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          阿妮塔101民用无人机: 30,
        },
      },
    },
  },
  菲妮娅: {
    4: {
      buyMore: {
        product: {
          大龙虾: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          大龙虾: 30,
        },
      },
    },
  },
  叶珏: {
    1: {
      buyMore: {
        product: {
          红茶: 20,
        },
      },
    },
    4: {
      buyMore: {
        product: {
          红茶: 20,
          家用太阳能电池组: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          红茶: 30,
          家用太阳能电池组: 20,
        },
      },
    },
  },
  黛丝莉: {
    4: {
      buyMore: {
        product: {
          毛绒玩具: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          毛绒玩具: 30,
        },
      },
    },
  },
  阿知波: {
    4: {
      buyMore: {
        product: {
          拼装模型: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          拼装模型: 30,
        },
      },
    },
  },
  塞西尔: {
    4: {
      buyMore: {
        product: {
          香水: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          香水: 30,
        },
      },
    },
  },
  瓦伦汀: {
    4: {
      buyMore: {
        product: {
          学会书籍: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          学会书籍: 30,
        },
      },
    },
  },
  魇: {
    1: {
      buyMore: {
        product: {
          刀具: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          刀具: 30,
        },
      },
    },
  },
  奈弥: {
    1: {
      buyMore: {
        product: {
          金箔酒: 20,
        },
      },
    },
    5: {
      buyMore: {
        product: {
          金箔酒: 30,
        },
      },
    },
  },
  甘雅: {
    4: {
      buyMore: {
        city: {
          曼德矿场: 20,
        },
      },
    },
    5: {
      buyMore: {
        city: {
          曼德矿场: 30,
        },
      },
    },
  },
  艾略特: {
    4: {
      buyMore: {
        product: {
          游戏机: 20,
          游戏卡带: 20,
        },
      },
    },
  },
  朱利安: {
    1: {
      buyMore: {
        product: {
          斑节虾: 20,
        },
      },
    },
    4: {
      buyMore: {
        product: {
          斑节虾: 20,
        },
        city: {
          七号自由港: 20,
        },
      },
    },
  },
  瑞秋: {
    4: {
      buyMore: {
        product: {
          医疗药品: 20,
        },
      },
    },
  },
  山岚: {
    4: {
      buyMore: {
        product: {
          折扇: 20,
        },
      },
    },
  },
  卡莲: {
    4: {
      buyMore: {
        city: {
          贡露城: 20,
        },
      },
    },
  },
  静流: {
    4: {
      buyMore: {
        city: {
          海角城: 20,
        },
      },
    },
  },
  雷火: {
    4: {
      buyMore: {
        product: {
          曼德工具箱: 20,
        },
      },
    },
  },
  狮鬃: {
    1: {
      buyMore: {
        product: {
          荧光棒: 20,
        },
      },
    },
    4: {
      buyMore: {
        product: {
          荧光棒: 20,
          扬声器: 20,
        },
      },
    },
  },
  妮蔻拉: {
    4: {
      buyMore: {
        city: {
          阿妮塔能源研究所: 20,
        },
      },
    },
    5: {
      buyMore: {
        city: {
          阿妮塔能源研究所: 30,
        },
      },
    },
  },
};

/*

data validation:


allP = new Set()
allC = new Set()
for (const rName in roles) {
    const skill = roles[rName]
    const pNames = Object.keys(skill.buyMore.product)
    if (pNames.length) allP.add(...pNames)
    const cNames = Object.keys(skill.buyMore.city)
    if (cNames.length) allC.add(...cNames)
}
allPs = [...allP]
allCs = [...allC]
missingP = []
missingC = []
for (const n of allPs) {
    const found = dataPdts.find(p => p.name === n)
    if (!found) missingP.push(n)
}
for (const n of allCs) {
    const found = dataCities.find(c => c === n)
    if (!found) missingC.push(n)
}

console.warn('missingP', missingP)
console.warn('missingC', missingC)

TODO:
missingP (9) ['大龙虾', '毛绒玩具', '拼装模型', '香水', '学会书籍', '刀具', '金箔酒', '医疗药品', '折扇']
missingC (2) ['贡露城', '海角城']
*/
