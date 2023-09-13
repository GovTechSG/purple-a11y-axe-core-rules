import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as extractors from "./extractors/index.js";
import mainProcess from "./process.js";
import { jsonDiff, writeDataToFile } from "./utils.js";

const cliOptions = {
  m: {
    alias: "mode",
    describe:
      "mode of result file. extraction - extract for a single version, diff - generates diff file for two versions",
    choices: ["extraction", "diff"],
    default: "extraction",
    coerce: (opt) => {
      if (typeof opt === "number") {
        switch (opt) {
          case 1:
            return "extraction";
          case 2:
            return "diff";
        }
      }
      return opt;
    },
  },
  t: {
    alias: "type",
    describe: "type of extraction of axe-core rules and checks",
    choices: ["complete", "incomplete"],
    default: "complete",
  },
  v: {
    alias: "version",
    describe: "version of axe-core to extract",
    default: "master",
  },
  a: {
    alias: "versionAfter",
    describe: "version of axe-core to compare diff. only for diff mode",
  },
};

const options = yargs(hideBin(process.argv))
  .version(false)
  .example([
    [
      `Extract all rules of axe-core v4.7.2:`,
      `node index.js -t complete -v v4.7.2`,
    ],
    [
      `Extract all incomplete rules of axe-core master:`,
      `node index.js -t incomplete -v master`,
    ],
  ])
  .options(cliOptions)
  .check(({ mode, version, versionAfter }) => {
    if (mode === "extraction" && versionAfter) {
      throw new Error("v2 - versionAfter only used for diff mode");
    }

    if (mode === "diff") {
      if (!versionAfter) {
        throw new Error(
          "a - versionAfter not provided and is required for diff mode"
        );
      } else if (versionAfter === version) {
        throw new Error(
          `please provide different versions for version and versionAfter, provided: ${version}`
        );
      }
    }
    return true;
  })
  .strictOptions(true)
  .help("help").argv;

const main = async ({ mode, type, version, versionAfter }) => {
  try {
    const extractor = extractors[type.trim().toLowerCase()];
    if (!extractor) {
      throw new Error(
        `Type provided not defined: ${type}. Please provide either ["complete", "incomplete"]`
      );
    }

    let resultDir, resultFileName, contentToWrite;
    if (mode === "extraction") {
      const { data } = await mainProcess(version, extractor);
      contentToWrite = JSON.stringify(data, null, 2);
      resultDir = "results";
      resultFileName = `${extractor.fileName}_${version}`;
    } else if (mode === "diff") {
      const { data } = await mainProcess(version, extractor);
      const { data: dataAfter } = await mainProcess(versionAfter, extractor);
      const diffData = jsonDiff({ version, data, versionAfter, dataAfter });

      contentToWrite = JSON.stringify(diffData, null, 2);
      resultDir = "results";
      resultFileName = `${extractor.fileName}_diff_${version}_vs_${versionAfter}`;
    }

    writeDataToFile(resultDir, resultFileName, ".json", contentToWrite);
  } catch (err) {
    console.error("Program exited:", err);
  }
};

main(options);
