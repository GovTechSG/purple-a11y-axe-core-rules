import { markdownTable } from "markdown-table";
import { writeDataToFile } from "../utils.js";

/*
  **********************
  Information Extractor
  **********************
  The goal is to extract information of rules to understand what axe-core checks for.

  Only rules that meet either of this criteria are extracted:
  1. Rules that are enabled
  2. Rules that are not experimental
*/
const informationFileName = "information_rules";

const STANDARDS = {
  wcag2a: "WCAG 2.0 Level A",
  wcag2aa: "WCAG 2.0 Level AA",
  wcag2aaa: "WCAG 2.0 Level AAA",
  wcag21a: "WCAG 2.1 Level A",
  wcag21aa: "WCAG 2.1 Level AA",
  wcag22aa: "WCAG 2.2 Level AA",
  "best-practice": "Best Practice",
};

const IMPACTS = {
  critical: "Must Fix",
  serious: "Must Fix",
  default: "Good to Fix",
};

const informationRulesReducer = (_checks) => (acc, ruleData) => {
  const { enabled, tags, metadata, impact } = ruleData;

  if (enabled === false) {
    return acc;
  }
  if (tags.includes("experimental")) {
    return acc;
  }
  const severity = IMPACTS[impact] || IMPACTS.default;
  const standard = STANDARDS[tags.find((tag) => STANDARDS[tag])];
  const conformance = tags
    .filter((tag) => !STANDARDS[tag] && tag.startsWith("wcag"))
    .map((wcagTag) => {
      const [wcagSection, subSection, ...sectionItem] = wcagTag.slice(4);
      return `WCAG ${wcagSection}.${subSection}.${sectionItem.join("")}`;
    });

  let ruleInfo = {
    issueId: ruleData.id,
    issueDescription: metadata.description,
    severity,
    conformance: conformance.length ? conformance : undefined,
  };

  if (acc[standard]) {
    acc[standard].push(ruleInfo);
  } else {
    acc[standard] = [ruleInfo];
  }

  return acc;
};

const informationPostOp = (standardRules, axeVersion) => {
  // group and format markdown here
  // 1. sort into sections
  const escapeHTMLMarkdown = (val) => val.replace(/<([^>]+)>/g, "`<$1>`");
  const formatMarkdownLinkToSection = (val) =>
    `[${val}](#${val.replaceAll(" ", "-").replaceAll(".", "").toLowerCase()})`;

  const filteredStandards = Object.values(STANDARDS).filter(
    (standard) => standardRules[standard]
  );

  const conformanceSet = new Set();
  const conformanceCoveredTitle = "Conformance Covered";
  const title = `# Issues`;
  const tableOfContents =
    `## Table Of Contents\n` +
    [conformanceCoveredTitle, ...filteredStandards]
      .map((val, idx) => `${idx + 1}. ${formatMarkdownLinkToSection(val)}`)
      .join("\n");

  const tables = filteredStandards
    .map((standard) => {
      const headers = ["Issue ID", "Issue Description", "Severity"];
      if (standard !== STANDARDS["best-practice"]) {
        headers.push("Conformance");
      }
      const result = [headers];
      standardRules[standard].forEach((rule) => {
        const ruleInfo = [
          rule.issueId,
          escapeHTMLMarkdown(rule.issueDescription),
          rule.severity,
        ];
        if (rule.conformance) {
          ruleInfo.push(rule.conformance.join(", "));
          rule.conformance.forEach((c) => conformanceSet.add(c));
        }
        result.push(ruleInfo);
      });

      return `## ${standard}\n` + markdownTable(result);
    })
    .join("\n\n");

  const conformances =
    `## ${conformanceCoveredTitle}\n` +
    markdownTable([
      ["Conformance"],
      ...Array.from(conformanceSet)
        .sort()
        .map((c) => [c]),
    ]);

  const markdown = [title, tableOfContents, conformances, tables].join("\n\n");

  writeDataToFile(
    "results",
    `information_issues_${axeVersion}`,
    ".md",
    markdown
  );

  // return back the same object given to be written to json
  return standardRules;
};

const informationExtractor = {
  fileName: informationFileName,
  ruleReducer: informationRulesReducer,
  ruleAcc: {},
  postOp: informationPostOp,
};

export default informationExtractor;
