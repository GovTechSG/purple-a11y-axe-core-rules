import fs from "fs";
import _ from "lodash";
import path from "path";

export const writeDataToFile = (resultDir, resultFileName, contentToWrite) => {
  try {
    if (!fs.existsSync(resultDir)) {
      fs.mkdirSync(resultDir, { recursive: true });
    }

    const alreadyExists = fs.existsSync(path.join(resultDir, resultFileName));

    fs.writeFileSync(
      path.join(resultDir, resultFileName),
      contentToWrite,
      "utf8"
    );
    console.log(
      `File ${
        alreadyExists ? "updated" : "written"
      } successfully. ${resultFileName}`
    );
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
  const result = {};
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

  console.log(
    `DIFF STATS [before: ${v1}] [after: ${v2}]\nrules removed: ${keysRemoved.length} || rules added: ${keysAdded.length} || rules updated: ${keysUpdated}`
  );

  return result;
};
