import _ from "lodash";
import path from "path";
import { simpleGit } from "simple-git";
import { extractFileNames, reducePaths } from "./utils.js";

export const axeCoreDirPath = "axe-core";

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
      ".json",
      checkReducer,
      checkAcc || {}
    );
  }

  let processedRules = {};
  if (ruleReducer) {
    const rulesFilePaths = extractFileNames(path.join(libPath, "rules"));
    processedRules = reducePaths(
      rulesFilePaths,
      ".json",
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
