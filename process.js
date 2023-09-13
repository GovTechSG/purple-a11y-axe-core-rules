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
  { checkReducer, checkAcc, ruleReducer, ruleAcc, postOp }
) => {
  await simpleGit(axeCoreDirPath).checkout(axeVersion, (err) => {
    if (err) {
      throw new Error(`Error switching to ${axeVersion} branch`, err);
    }

    console.log(`Switched to branch: ${axeVersion}`);
  });

  const libPath = path.join(axeCoreDirPath, "lib");

  let processedChecks = {};
  if (checkReducer) {
    const checksFilePaths = extractFileNames(path.join(libPath, "checks"));
    processedChecks = reducePaths(
      checksFilePaths,
      checkReducer,
      checkAcc || {}
    );
  }

  let processedRules = {};
  if (ruleReducer) {
    const rulesFilePaths = extractFileNames(path.join(libPath, "rules"));
    processedRules = reducePaths(
      rulesFilePaths,
      ruleReducer(processedChecks),
      ruleAcc || {}
    );
  } else {
    processedRules = processedChecks;
  }

  if (postOp) {
    processedRules = postOp(processedRules, axeVersion);
  }

  // necessary to stringify and parse because the IDs have invalid characters
  return { data: JSON.parse(JSON.stringify(processedRules)) };
};

export default process;
