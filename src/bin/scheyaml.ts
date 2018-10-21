#!/usr/bin/env node

/* tslint:disable:no-console */
import commander, { CommanderStatic } from "commander";
import chalk from "chalk";
import _ from "lodash";
import figures from "figures";
import { ErrorObject } from "ajv";

import { Scheyaml } from "../lib/scheyaml";
import { defaultConfig, version, IScheyamlConfig } from "../lib/config";
import { globFiles } from "../lib/utils";
import * as schema from "../lib/schema";
import * as ui from "../lib/ui";
import { ScheyamlDirectiveError, ScheyamlUnknownSchemaError } from "../lib/errors";

interface ICliConfig {
  schemasOnly: boolean;
  targets: string[];
  schemas: string[];
}

interface IValidationFailure {
  schemaId: string;
  filePath: string;
  errors: ErrorObject[];
}

export function cli() {
  commander
    .version(version)
    .option("-t --targets <target>", "add a glob pattern for validation targets", collect, [])
    .option("-s --schemas <glob>", "add a glob pattern for schemas", collect, [])
    .option("-e --exclude <glob>", "add a glob pattern to exclude from schemas and targets", collect, [])
    .option("--schemas-only", "only load and validate schemas")
    .parse(process.argv);

  function collect(value: string, list: string[]) {
    list.push(value);
    return list;
  }

  return buildConfig(commander as CommanderStatic & ICliConfig);
}

export function buildConfig(commanderObj: CommanderStatic & ICliConfig): IScheyamlConfig {
  const config = Object.assign({}, defaultConfig);

  if (commanderObj.schemasOnly) {
    config.schemasOnly = commanderObj.schemasOnly;
  }
  if (commanderObj.schemas.length > 0) {
    config.schemaPatterns = commanderObj.schemas;
  }
  if (commanderObj.targets.length > 0) {
    config.targetPatterns = commanderObj.targets;
  }

  if (commanderObj.exclude.length > 0) {
    config.excludePatterns = commanderObj.exclude;
  }

  return config;
}

function runScheyaml(config: IScheyamlConfig) {
  let exitWithError = false;

  const excludeFilenames = globFiles(config.excludePatterns);
  console.log(config.excludePatterns);
  console.log(excludeFilenames);
  console.log("Excluding " + excludeFilenames.length);

  console.log(`scheyaml v${version}`);
  console.log();
  process.stdout.write("Globbing schemas... ");
  const schemaFilePaths = _.difference(globFiles(config.schemaPatterns), excludeFilenames);
  console.log(chalk.yellow(`Found ${schemaFilePaths.length} schemas!`));

  console.log();
  const scheyaml = new Scheyaml();
  for (const schemaFilePath of schemaFilePaths) {
    try {
      const schemaId = scheyaml.addSchema(schemaFilePath);
      console.log(ui.loadSchemaOk(schemaId, schemaFilePath));
    } catch (e) {
      if (e instanceof ScheyamlDirectiveError) {
        console.log(ui.loadSchemaDirectiveError(schemaFilePath, e.message));
      } else {
        console.log(ui.loadSchemaFail(schemaFilePath));
        throw e;
      }
    }
  }
  console.log();

  if (!config.schemasOnly) {
    process.stdout.write("Globbing targets... ");
    const targetFilePaths = _.difference(globFiles(config.targetPatterns), _.union(schemaFilePaths, excludeFilenames));
    console.log(chalk.yellow(`Found ${targetFilePaths.length} targets!`));

    console.log();
    const failures: IValidationFailure[] = [];
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
        validation.passes.forEach(pass => console.log(ui.validateOk(pass.schemaId, filePath)));

        failures.push(
          ...validation.failures.map(failure => ({
            filePath,
            schemaId: failure.schemaId,
            errors: failure.errors
          }))
        );
        validation.failures.forEach(failure => console.log(ui.validateFailed(failure.schemaId, filePath)));
      } catch (e) {
        if (e instanceof ScheyamlUnknownSchemaError) {
          console.log(ui.validateUnknownSchema(e.schemaId, filePath));
        } else if (e instanceof ScheyamlDirectiveError) {
          console.log(ui.validateNoSchemas(filePath));
        } else {
          console.log(ui.validateLoadError(filePath, e));
        }
      }
    }

    const numPassed = passes.length;
    const numFailed = failures.length;
    const numErrors = failures.reduce((errorSum, failure) => failure.errors.length + errorSum, 0);

    console.log();

    for (const failure of failures) {
      ui.validationFailureHeading(failure.schemaId, failure.filePath);
      for (const error of failure.errors) {
        console.log();
        console.log(ui.validationFailureError(error));
      }
      console.log();
    }

    if (numFailed === 0) {
      console.log(chalk.green(`== ${figures.tick} ${numPassed} passed, ${numFailed} failed (${numErrors} errors) ==`));
    } else {
      console.log(chalk.red(`== ${figures.cross} ${numPassed} passed, ${numFailed} failed (${numErrors} errors) ==`));
      exitWithError = true;
    }
  }

  console.log();
  console.log(chalk.yellow(`${figures.tick} Done!`));

  if (exitWithError) {
    process.exit(1);
  }
}

const scheyamlConfig = cli();

runScheyaml(scheyamlConfig);
