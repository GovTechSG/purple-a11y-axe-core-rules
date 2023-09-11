const incompleteFileName = "incomplete_rules";

const incompleteChecksReducer = (acc, data) => {
  const incomplete = data?.metadata?.messages?.incomplete;
  if (incomplete) {
    acc[data.id] = incomplete;
  }

  return acc;
};

const incompleteRulesReducer = (incompleteChecks) => (acc, data) => {
  const processCheckArray = (arr) =>
    arr
      .filter((c) => incompleteChecks[c])
      .map((c) => ({
        check_id: c,
        incomplete: incompleteChecks[c],
      }));

  // arrays with check ids
  const { all, any, none } = data;
  const pAll = processCheckArray(all);
  const pAny = processCheckArray(any);
  const pNone = processCheckArray(none);
  if (pAll.length || pAny.length || pNone.length) {
    const ruleInfo = {
      rule_id: data.id,
    };
    if (pAll) {
      ruleInfo.all = pAll;
    }
    if (pAny) {
      ruleInfo.any = pAny;
    }
    if (pNone) {
      ruleInfo.none = pNone;
    }

    acc[data.id] = ruleInfo;
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
