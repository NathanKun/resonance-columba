import { RsnsUnpacker, getJimpPNG } from "@tsuk1ko/rsns-unpack";
import { writeFile, readdir } from "fs/promises";
import { RESONANCE_SKILLS } from "resonance-data-columba/dist/columbabuild";

const ROLES_HEAD_DIR = "public/roles/head";

/**
 * Find roles in `RESONANCE_SKILLS` whose images don't exist in `public/roles/head`
 */
const getMissingHeads = async () => {
  const existHeads = new Set((await readdir(ROLES_HEAD_DIR)).map((name) => name.replace(/\.png$/, "")));
  const missingHeads = Object.keys(RESONANCE_SKILLS).filter((name) => !existHeads.has(name));
  return missingHeads;
};

const downloadHeads = async (unpacker: RsnsUnpacker, names: string[]) => {
  const unitFactory = await unpacker.getBinaryConfig("UnitFactory");

  for (const name of names) {
    console.info(`Downloading ${name}...`);
    try {
      // It should be restricted to `mod === "玩家角色"` as there are also enemy roles
      const id = unitFactory.find((unit) => unit.name === name && unit.mod === "玩家角色")?.id;
      if (!id) throw new Error(`Can't find unit ${name}`);

      const image = await unpacker.getCharacterImage(id);
      const png = await getJimpPNG(image);

      await writeFile(`${ROLES_HEAD_DIR}/${name}.png`, png);
    } catch (e) {
      console.error(e);
    }
  }
};

const main = async () => {
  const unpacker = new RsnsUnpacker();

  const missingHeads = await getMissingHeads();

  // Download roles's heads
  if (missingHeads.length) {
    await downloadHeads(unpacker, missingHeads);
  }
};

main()
  .then(() => console.log("done"))
  .catch(console.error);
