const completeFileName = "complete_rules";

const completeChecksReducer = (acc, _data) => {
  return acc;
};

const completeRulesReducer = (_completeChecks) => (acc, data) => {
  const ruleInfo = {
    rule_id: data.id,
    all: data.all,
    any: data.any,
    none: data.none,
  };

  acc[data.id] = ruleInfo;

  return acc;
};

const completeExtractor = {
  fileName: completeFileName,
  checkReducer: completeChecksReducer,
  checkAcc: {},
  ruleReducer: completeRulesReducer,
  ruleAcc: {},
};

export default completeExtractor;
