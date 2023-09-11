import _ from "lodash";
import path from "path";
import fs from "fs";
import { simpleGit } from "simple-git";

const axeCoreDirPath = "axe-core";

const extractFileNames = (dir) => {
  const files = fs.readdirSync(dir);

  return files.flatMap((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      return extractFileNames(filePath);
    }

    return filePath;
  });
};

const reducePaths = (filePaths, reducer, acc) =>
  filePaths
    .filter((file) => _.endsWith(file, ".json"))
    .map((file) => JSON.parse(fs.readFileSync(file)))
    .reduce(reducer, acc);

const process = async (
  axeVersion,
  { checkReducer, checkAcc, ruleReducer, ruleAcc }
) => {
  await simpleGit(axeCoreDirPath).checkout(axeVersion, (err) => {
    if (err) {
      throw new Error(`Error switching to ${axeVersion} branch`, err);
    }

    console.log(`Switched to branch: ${axeVersion}`);
  });

  const libPath = path.join(axeCoreDirPath, "lib");
  const checksFilePaths = extractFileNames(path.join(libPath, "checks"));
  const processedChecks = reducePaths(checksFilePaths, checkReducer, checkAcc);

  const rulesFilePaths = extractFileNames(path.join(libPath, "rules"));
  const rules = reducePaths(
    rulesFilePaths,
    ruleReducer(processedChecks),
    ruleAcc
  );

  // necessary to stringify and parse because the IDs have invalid characters
  return { data: JSON.parse(JSON.stringify(rules)) };
};

export default process;
