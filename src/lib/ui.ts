import chalk from "chalk";
import paddington from "paddington";
import figures from "figures";
import { ErrorObject } from "ajv";

export const loadedSchemaOk = (schema: string, file: string) => resultLine(chalk.green("OK"), chalk.green(`Loaded '${schema}' from '${file}'`));
export const loadedSchemaNoId = (file: string) => resultLine(chalk.yellow("WARN"), chalk.yellow(`No schema ID defined in '${file}'`));
export const loadSchemaFail = (file: string) => resultLine(chalk.red("ERROR"), chalk.red(`Failed loading schema from '${file}'`));

export const validateOk = (schema: string, file: string) => resultLine(chalk.green("OK"), chalk.green(`Schema '${schema}' validated by '${file}'`));
export const validateFailed = (schema: string, file: string) => resultLine(chalk.red("FAIL"), chalk.red(`Schema '${schema}' failed by '${file}'`));
export const validateNoSchemas = (file: string) => resultLine(chalk.gray("---"), chalk.gray(`No schemas declared by '${file}'`));
export const validateUnknownSchema = (schema: string, file: string) => resultLine(chalk.yellow("WARN"), chalk.yellow(`Unknown schema '${schema}' declared in '${file}`));

export function resultLine(status: string, text: string) {
  paddington
    .text(status, 8)
    .text(text)
    .print();
}

export function validationFailureHeading(schema: string, file: string) {
  paddington
    .text(chalk.red(figures.cross), 2)
    .text(chalk.grey(`Schema '${schema}' for '${file}':`))
    .print();
}
export function validationFailureError(error: ErrorObject) {
  paddington
    .pad(4)
    .text(chalk.red(`${error.keyword}: ${error.dataPath} ${error.message}`))
    .print();
}
