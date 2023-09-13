/*
  *******************
  Complete Extractor
  *******************
  The goal is to extract information from rules to assess impacts of version upgrades.

  All rules are to be extracted along with the check ids in all/any/none.

  Note: Enabled (false) and Experimental rules are still extracted but indicated respectively.
        These rules are not run by default.

        reviewOnFail is also extracted to indicate rules that return as "Needs Review" on failure
*/
const completeFileName = "complete_rules";

const completeRulesReducer = () => (acc, ruleData) => {
  const { all, any, none, reviewOnFail, enabled, tags, metadata } = ruleData;

  let ruleInfo = {
    ruleId: ruleData.id,
    description: metadata.description,
    enabled,
    experimental: tags.includes("experimental") || undefined,
    reviewOnFail,
    all,
    any,
    none,
  };

  acc[ruleData.id] = ruleInfo;

  return acc;
};

const completeExtractor = {
  fileName: completeFileName,
  ruleReducer: completeRulesReducer,
  ruleAcc: {},
};

export default completeExtractor;
