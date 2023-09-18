import path from "path";
import fs from "fs";
import _ from "lodash";
import { load } from "cheerio";
import { parse } from "node-html-parser";
import { axeCoreDirPath } from "../process.js";
import { extractFileNames, reducePaths, writeDataToFile } from "../utils.js";

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
            checkId: checkID,
            fail: checksMessages[checkID].fail,
            incomplete: checksMessages[checkID].incomplete,
          };
        }

        return {
          checkId: checkID,
          incomplete: checksMessages[checkID].incomplete,
        };
      });

  const pAll = processCheckArray(all);
  const pAny = processCheckArray(any);
  const pNone = processCheckArray(none);
  if (pAll.length || pAny.length || pNone.length || reviewOnFail) {
    const ruleInfo = {
      ruleId: ruleData.id,
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

const incompletePostOp = (rules) => {
  const result = _.cloneDeep(rules);
  const testPath = path.join(axeCoreDirPath, "test", "integration", "rules");

  // to compile all html snippets into a html file for better readability
  const ruleInfoForHTMLFile = [];

  const formHTMLSection = (heading, message, ...snippets) => {
    const section = [`<!-- ${heading} -->`];
    message && section.push(`<!-- ${message} -->`);
    snippets && section.push(snippets.join("\n<!----------->\n"));
    return section.join("\n");
  };

  Object.keys(result).forEach((ruleId) => {
    const ruleInfo = result[ruleId];
    // only find snippets for enabled and non-experimental rules
    const isDisabledOrExperimental =
      (ruleInfo.hasOwnProperty("enabled") && !ruleInfo.enabled) ||
      (ruleInfo.hasOwnProperty("experimental") && ruleInfo.experimental);

    const ruleTestPath = path.join(testPath, ruleId);
    if (!fs.existsSync(ruleTestPath)) {
      console.log(`%!@$!%@!%@$!@$ Nooooooooo why no test for ${ruleId}`);
      rules[ruleId].incompleteElements = `No tests for ${ruleId}`;
      ruleInfoForHTMLFile.push(formHTMLSection(ruleId, `No tests for ${ruleId}`, undefined));
      return;
    }

    const fileNames = extractFileNames(ruleTestPath);

    const htmlReducer = (acc, testData) => {
      // testData is fs.readFile().toString() value of html file
      return `${acc} ${testData}`;
    };

    // to compile all ids that are used to test for incomplete rules
    const jsonReducer = (status="incomplete") => {
      return (acc, testObj) => {
        const ids = testObj[status]; // in the form [["#incomplete1"], ["#incomplete2"], ...]
        return ids ? [...acc, ...ids] : acc;
      }
    }

    const reducedHtml = reducePaths(
      fileNames,
      ".html",
      htmlReducer,
      ""
    ).replace(/\n/g, " ");
    const incompleteIds = reducePaths(
      fileNames,
      ".json",
      jsonReducer("incomplete"),
      [],
    );
    result[ruleId].wholeHtml = reducedHtml;

    // TODO: html not always has elements with id=incomplete
    // will need to figure some other identifier, maybe innertext or any text that has incomplete?
    const dom = parse(reducedHtml);

    const htmlSnippets = new Set();

    if (incompleteIds.length === 0) {
      const message = `No related tests found for incomplete rule ${ruleId}`;
      result[ruleId].incompleteElements = message;
      ruleInfoForHTMLFile.push(formHTMLSection(ruleId, message, undefined));
      return;
    }

    for (let [id] of incompleteIds) {
      const idName = id.substring(1); // remove # symbol
      let htmlSnippet = "";
      
      const incompleteElements = dom.querySelectorAll(
        `[id="${idName}"], [aria-labelledby*="${idName}"], [for="${idName}"]`
      );
      if (incompleteElements.length > 1) {
        // there are other related elements e.g. <label>
        incompleteElements.forEach((element) => {
          htmlSnippet += element.outerHTML;
          htmlSnippet += "\n";
        })
      } else {
        const htmlElement = incompleteElements[0];
        htmlSnippet = htmlElement.outerHTML;

        // give the enclosing parent element if available (for additional context)
        const parent = htmlElement.closest(`:not(${id})`);
        if (parent && parent.tagName !== "BODY") {
          htmlSnippet = parent.outerHTML;
        }
      }
      htmlSnippets.add(htmlSnippet);
    }

    const htmlSnippetsArray = Array.from(htmlSnippets);
    ruleInfoForHTMLFile.push(
      formHTMLSection(
        ruleId,
        isDisabledOrExperimental
          ? "This rule is disabled/experimental"
          : undefined,
        ...htmlSnippetsArray
      )
    );

    result[ruleId].incompleteElements = htmlSnippetsArray; // add snippets to result json file
  });

  const compiledHTML = ruleInfoForHTMLFile.join("\n\n\n");

  writeDataToFile("results", "html_snippets_incomplete", ".html", compiledHTML);

  return result;
};

const incompleteExtractor = {
  fileName: incompleteFileName,
  checkReducer: incompleteChecksReducer,
  checkAcc: {},
  ruleReducer: incompleteRulesReducer,
  ruleAcc: {},
  postOp: incompletePostOp,
};

export default incompleteExtractor;
