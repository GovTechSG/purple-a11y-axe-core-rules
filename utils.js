import fs from "fs";
import _ from "lodash";
import path from "path";

export const writeDataToFile = (
  resultDir,
  resultFileName,
  fileType,
  contentToWrite
) => {
  try {
    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }

    let fileName = resultFileName + fileType;
    let counter = 1;
    let alreadyExists;
    do {
      alreadyExists = fs.existsSync(path.join(resultDir, fileName));

      if (alreadyExists) {
        fileName = `${resultFileName}_${counter}${fileType}`;
        counter += 1;
        continue;
      }

      fs.writeFileSync(path.join(resultDir, fileName), contentToWrite, "utf8");
      console.log(
        `File written successfully. ${path.join(resultDir, fileName)}`
      );
      break;
    } while (true);
  } catch (err) {
    throw new Error(`Error writing to file: ${err}`);
  }
};

export const jsonDiff = ({
  version: v1,
  data: o1,
  versionAfter: v2,
  dataAfter: o2,
}) => {
  let result = {};
  const beforeKeys = Object.keys(o1);
  const afterKeys = Object.keys(o2);

  const keysRemoved = _.difference(beforeKeys, afterKeys);
  const keysAdded = _.difference(afterKeys, beforeKeys);
  let keysUpdated = 0;
  const keysSame = _.intersection(beforeKeys, afterKeys);

  keysRemoved.forEach((k) => {
    result[k] = { [v1]: o1[k], [v2]: {} };
  });
  keysAdded.forEach((k) => {
    result[k] = { [v1]: {}, [v2]: o2[k] };
  });
  keysSame.forEach((k) => {
    if (!_.isEqual(o1[k], o2[k])) {
      keysUpdated += 1;
      result[k] = { [v1]: o1[k], [v2]: o2[k] };
    }
  });

  const summary = `[before: ${v1}] [after: ${v2}] removed: ${keysRemoved.length} || added: ${keysAdded.length} || updated: ${keysUpdated}`;
  console.log(`DIFF SUMMARY: ${summary}`);

  result = {
    summary,
    ...result,
  };

  return result;
};
