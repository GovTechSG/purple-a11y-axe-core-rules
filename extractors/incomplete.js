/*
  *********************
  Incomplete Extractor
  *********************
  The goal is to extract information from rules and checks to be able to assesss findings
  with needs review.

  Only rules that meet either of this criteria are extracted:
  1. Rules that have checks with incomplete messages
  2. Rules with `reviewOnFail`

  Note: Enabled (false) and Experimental rules are still extracted but indicated respectively.
        These rules are not run by default.
*/
const incompleteFileName = "incomplete_rules";

const incompleteChecksReducer = (acc, checkData) => {
  acc[checkData.id] = checkData?.metadata?.messages;

  return acc;
};

/*
  Explanation of fields used in rule data
  ========================================================================================
  reviewOnFail: rule to return "Needs Review" rather than "Violation" if the rule fails
  enabled: whether the rule is turned on
  tags: rules `experimental` tag will not run by default
  all/any/none: arrays with check ids
*/
const incompleteRulesReducer = (checksMessages) => (acc, ruleData) => {
  const { all, any, none, reviewOnFail, enabled, tags } = ruleData;

  const processCheckArray = (arr) =>
    // if reviewOnFail=true will need to extract fail message of checks
    // else only want incomplete messages
    arr
      .filter((checkID) => reviewOnFail || checksMessages[checkID].incomplete)
      .map((checkID) => {
        if (reviewOnFail) {
          return {
            check_id: checkID,
            fail: checksMessages[checkID].fail,
            incomplete: checksMessages[checkID].incomplete,
          };
        }

        return {
          check_id: checkID,
          incomplete: checksMessages[checkID].incomplete,
        };
      });

  const pAll = processCheckArray(all);
  const pAny = processCheckArray(any);
  const pNone = processCheckArray(none);
  if (pAll.length || pAny.length || pNone.length || reviewOnFail) {
    const ruleInfo = {
      rule_id: ruleData.id,
    };
    if (enabled === false) {
      ruleInfo.enabled = false;
    }
    if (tags.includes("experimental")) {
      ruleInfo.experimental = true;
    }
    ruleInfo.reviewOnFail = reviewOnFail;
    ruleInfo.all = pAll;
    ruleInfo.any = pAny;
    ruleInfo.none = pNone;

    acc[ruleData.id] = ruleInfo;
  }

  return acc;
};

const incompleteExtractor = {
  fileName: incompleteFileName,
  checkReducer: incompleteChecksReducer,
  checkAcc: {},
  ruleReducer: incompleteRulesReducer,
  ruleAcc: {},
};

export default incompleteExtractor;
