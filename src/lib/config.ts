export interface IScheyamlConfig {
  schemaPatterns: string[];
  schemasOnly: boolean;
  targetPatterns: string[];
  excludePatterns: string[];
}

export const defaultConfig: IScheyamlConfig = {
  schemaPatterns: ["**/*.schema.y?(a)ml"],
  schemasOnly: false,
  targetPatterns: ["**/*.y?(a)ml"],
  excludePatterns: []
};

export const version = require("../../package.json").version; // tslint:disable-line
