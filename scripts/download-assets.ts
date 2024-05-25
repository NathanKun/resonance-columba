import { CharacterImageType, RsnsUnpacker, getJimpPNG } from "@tsuk1ko/rsns-unpack";
import { writeFile } from "fs/promises";
import { RESONANCE_SKILLS } from "resonance-data-columba/dist/columbabuild";

const main = async () => {
  const unpacker = new RsnsUnpacker();

  const version = await unpacker.getLatestVersion();
  console.info("Ver " + version);

  const unityFactory = await unpacker.getBinaryConfig("UnitFactory");

  // for each role in RESONANCE_SKILLS, ddwnload the role's image
  for (const role in RESONANCE_SKILLS) {
    console.info(`Downloading ${role}...`);
    try {
      const image = await unpacker.getCharacterImage(
        unityFactory.find((unit) => unit.name === role)?.id,
        CharacterImageType.FACE
      );

      // 可以进行 resize 等各种处理，https://www.npmjs.com/package/jimp
      // image.resize(48, 48);

      const png = await getJimpPNG(image);

      await writeFile(`public/roles/head/${role}.png`, png);
    } catch (e) {
      console.error(e);
    }
  }
};

main()
  .then(() => console.log("done"))
  .catch(console.error);
