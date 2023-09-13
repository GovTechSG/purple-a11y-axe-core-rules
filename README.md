# Extract Axe Core Rules

This tool aims to make extracting and analyzing axe-core rules easier.
It makes use of axe-core's repository and checkouts to respective branches
to extract the information of rules. Furthermore, it is able to map the rules
to their respective checks.

Another use case would be for version upgrades of axe-core. This tool provides
functionality to create a diff comparison of 2 different versions.

## Getting Started

### Axe-Core Submodule

Only on first installation

```shell
git submodule init
```

On subsequent uses before you run, execute this command to update the axe-core submodule.

```shell
git submodule update
```

### Installing Dependencies

```
npm install
```

## How to Run

```shell
Options:
-m --mode mode of result file. extraction - extract for a single version
                             diff - generates diff file for two versions
                  [choices: "extraction", "diff"] [default: "extraction"]
-t, --type type of extraction of axe-core rules and checks
[choices: "complete", "incomplete", "information"] [default: "complete"]
-v, --version version of axe-core to extract          [default: "master"]
-a, --versionAfter version of axe-core to compare diff. only for diff mode
--help Show help [boolean]

Examples:
# Extract all rules of axe-core v4.7.2
node index.js -t complete -v v4.7.2

# Extract all incomplete rules of axe-core master
node index.js -m 1 -t incomplete

# Generate diff for complete rules of axe-core v4.6.2 and v4.7.2
node index.js -m diff -t complete -v v4.6.2 -a v4.7.2
```

All files can be found in the `results` folder in the main directory.

## Types

### incomplete

Result file name: `results/incomplete_rules*.json`

The goal is to extract information from rules and checks to be able to assess findings
with needs review.

Only rules that meet either of this criteria are extracted:

1. Rules that have checks with incomplete messages
2. Rules with `reviewOnFail` and all the fail messages of the checks under the rule

Note: Enabled (false) and Experimental rules are still extracted but indicated respectively.
These rules are not run by default.

### complete

Result file name: `results/complete_rules*.json`

The goal is to extract information from rules to assess impacts of version upgrades.

All rules are to be extracted along with the check ids in all/any/none.

Note: Enabled (false) and Experimental rules are still extracted but indicated respectively.
These rules are not run by default.
`reviewOnFail` is also extracted to indicate rules that return as "Needs Review" on failure.

### information

Result file name: `information_rules*.json, information_issues*.md`
The goal is to extract information of rules to understand what axe-core checks for.
The axe-core impact of each rule are mapped to Purple Hats severity levels (Must Fix, Good to Fix).

Only rules that meet either of this criteria are extracted:

1. Rules that are enabled
2. Rules that are not experimental

Furthermore, a markdown is produced with the results categorised by their respective standards.

## Customizing

To customize and create a new extractor based on certain filters or logic.
You can do so by adding to the `extractors` folder. For e.g. If you want to
create an extractor that only has checks with `pass` messages.

1. Create a new file for the extractor `extractors/myCustomExtractor.js`
2. Ensure that the file exports the necessary variables and implementation

```js
const myCustomExtractor = {
  // file name for generated file
  fileName,
  /* 
   Reducer when looping through checks impl of what to filter/map should be contained here
   (checkAcc, data) => {checkAcc}
  */
  checkReducer,
  /* 
   Accumlator object that will be passed to checkReducer
   You can use arrays or objects
  */
  checkAcc: {},
  /* 
   Reducer when looping through rules impl of what to filter/map should be contained here
   The final reduced check accumulator will also be passed
   (checkAcc) => (ruleAcc, data) => {ruleAcc}
  */
  ruleReducer,
  /* 
   Accumlator object that will be passed to ruleReducer
   You can use arrays or objects
  */
  ruleAcc: {},
  /* 
   Result from ruleReducer (if exists) or checkReducer will be passed to this function and executed.
   E.g. for information type, the markdown file is generated here.
   postOp = (ruleAcc, axeVersion)
  */
  postOp,
};

export default myCustomExtractor;
```

Note: All these fields are optional. If not provided, the step will be skipped.

3. Export the extractor in [`extractors/index.js`](extractors/index.js)

```js
export { default as custom } from "./myCustomExtractor.js";
```

4. Add the new extractor type to `type` for `cliOptions` in [`index.js`](index.js)

```js
  const cliOptions = {
  .
  .
  t: {
    alias: "type",
    describe: "type of extraction of axe-core rules and checks",
    choices: ["complete", "incomplete", "custom"],
    default: "complete",
  },
  .
  .
  }
```

5. Run the your new custom extractor

```shell
node index.js -t custom -v v4.8.0
```
