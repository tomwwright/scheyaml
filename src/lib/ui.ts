import chalk from "chalk";
import paddington from "paddington";
import figures from "figures";
import { ErrorObject } from "ajv";

export const loadSchemaOk = (schema: string, file: string) =>
  loadResult(chalk.green("OK"), chalk.green(`Loaded '${schema}' from '${file}'`));
export const loadSchemaDirectiveError = (file: string, error: string) =>
  loadResult(chalk.yellow("WARN"), chalk.yellow(`Directive error in '${file}': ${error}`));
export const loadSchemaFail = (file: string) =>
  loadResult(chalk.red("FAIL"), chalk.red(`Failed loading schema from '${file}'`));

export const validateOk = (schema: string, file: string) =>
  loadResult(chalk.green("OK"), chalk.green(`Schema '${schema}' validated by '${file}'`));
export const validateFailed = (schema: string, file: string) =>
  loadResult(chalk.red("FAIL"), chalk.red(`Schema '${schema}' failed by '${file}'`));
export const validateNoSchemas = (file: string) =>
  loadResult(chalk.gray("---"), chalk.gray(`No schemas declared by '${file}'`));
export const validateUnknownSchema = (schema: string, file: string) =>
  loadResult(chalk.yellow("WARN"), chalk.yellow(`Unknown schema '${schema}' declared in '${file}`));

export function loadResult(status: string, text: string) {
  const line = paddington
    .text(status, 8)
    .text(text)
    .toString();

  paddington.clear();

  return line;
}

export function validationFailureHeading(schema: string, file: string) {
  const line = paddington
    .text(chalk.red(figures.cross), 2)
    .text(chalk.grey(`Schema '${schema}' for '${file}':`))
    .toString();

  paddington.clear();

  return line;
}

export function validationFailureError(error: ErrorObject) {
  const line = paddington
    .pad(4)
    .text(chalk.red(`${error.keyword}: ${error.dataPath} ${error.message}`))
    .toString();

  paddington.clear();

  return line;
}
