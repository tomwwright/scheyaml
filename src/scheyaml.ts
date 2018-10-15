import commander, { CommanderStatic } from "commander";
import chalk from "chalk";
import _ from "lodash";
import figures from "figures";
import { ErrorObject } from "ajv";

import { defaultConfig, version, ScheyamlConfig } from "./lib/config";
import { globFiles } from "./lib/utils";
import * as schema from "./lib/schema";
import * as ui from "./lib/ui";
import { SchemaDirectiveError, ScheyamlUnknownSchemaError } from "./lib/errors";

type CliConfig = {
  schemasOnly: boolean;
  targets: string[];
  schemas: string[];
};

type ValidationFailure = {
  schemaId: string;
  filePath: string;
  errors: ErrorObject[];
};

export function cli() {
  commander
    .version(version)
    .option("-t --targets <target>", "add a glob pattern for validation targets", collect, [])
    .option("-s --schemas <glob>", "add a glob pattern for schemas", collect, [])
    .option("--schemas-only", "only load and validate schemas")
    .parse(process.argv);

  function collect(value: string, list: string[]) {
    list.push(value);
    return list;
  }

  return buildConfig(commander as CommanderStatic & CliConfig);
}

export function buildConfig(commander: CommanderStatic & CliConfig): ScheyamlConfig {
  const config = Object.assign({}, defaultConfig);

  if (commander.schemasOnly) config.schemasOnly = commander.schemasOnly;
  if (commander.schemas.length > 0) config.schemaPatterns = commander.schemas;
  if (commander.targets.length > 0) config.targetPatterns = commander.targets;

  return config;
}

function runScheyaml(config: ScheyamlConfig) {
  let exitWithError = false;

  console.log(`scheyaml v${version}`);
  console.log();
  process.stdout.write("Globbing schemas... ");
  const schemaFilePaths = globFiles(config.schemaPatterns);
  console.log(chalk.yellow(`Found ${schemaFilePaths.length} schemas!`));

  console.log();
  const scheyaml = new schema.Scheyaml();
  for (const schemaFilePath of schemaFilePaths) {
    try {
      const schemaId = scheyaml.addSchema(schemaFilePath);
      ui.loadedSchemaOk(schemaId, schemaFilePath);
    } catch (e) {
      if (e instanceof SchemaDirectiveError) {
        ui.loadedSchemaNoId(schemaFilePath);
      } else {
        ui.loadSchemaFail(schemaFilePath);
        throw e;
      }
    }
  }
  console.log();

  if (!config.schemasOnly) {
    process.stdout.write("Globbing targets... ");
    const targetFilePaths = _.difference(globFiles(config.targetPatterns), schemaFilePaths);
    console.log(chalk.yellow(`Found ${targetFilePaths.length} targets!`));

    console.log();
    const failures: ValidationFailure[] = [];
    const passes: { schemaId: string; filePath: string }[] = [];
    for (const filePath of targetFilePaths) {
      try {
        const validation = scheyaml.validate(filePath);

        passes.push(
          ...validation.passes.map(pass => ({
            filePath,
            schemaId: pass.schemaId
          }))
        );
        validation.passes.forEach(pass => ui.validateOk(pass.schemaId, filePath));

        failures.push(
          ...validation.failures.map(failure => ({
            filePath,
            schemaId: failure.schemaId,
            errors: failure.errors
          }))
        );
        validation.failures.forEach(failure => ui.validateFailed(failure.schemaId, filePath));
      } catch (e) {
        if (e instanceof ScheyamlUnknownSchemaError) {
          ui.validateUnknownSchema(e.schemaId, filePath);
        } else if (e instanceof SchemaDirectiveError) {
          ui.validateNoSchemas(filePath);
        } else {
          throw e;
        }
      }
    }

    const numPassed = passes.length;
    const numFailed = failures.length;
    const numErrors = failures.reduce((errorSum, failure) => failure.errors.length + errorSum, 0);

    console.log();

    for (let failure of failures) {
      ui.validationFailureHeading(failure.schemaId, failure.filePath);
      for (let error of failure.errors) {
        console.log();
        ui.validationFailureError(error);
      }
      console.log();
    }

    if (numFailed == 0) {
      console.log(chalk.green(`== ${figures.tick} ${numPassed} passed, ${numFailed} failed (${numErrors} errors) ==`));
    } else {
      console.log(chalk.red(`== ${figures.cross} ${numPassed} passed, ${numFailed} failed (${numErrors} errors) ==`));
      exitWithError = true;
    }
  }

  console.log();
  console.log(chalk.yellow(`${figures.tick} Done!`));

  if (exitWithError) process.exit(1);
}

const config = cli();

runScheyaml(config);
