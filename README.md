# Extract Axe Core Rules

This tool aims to make extracting and analyzing axe-core rules easier.
It makes use of axe-core's repository and checkouts to respective branches
to extract the information of rules. Furthermore, it is able to map the rules
to their respective checks.

Another use case would be for version upgrades of axe-core. This tool provides
functionality to create a diff comparison of 2 different versions.

## Setting up

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
                [choices: "complete", "incomplete"] [default: "complete"]
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
};

export default myCustomExtractor;
```

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
