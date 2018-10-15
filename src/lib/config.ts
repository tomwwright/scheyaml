export type ScheyamlConfig = {
  targetPatterns: string[];
  schemaPatterns: string[];
  schemasOnly: boolean;
};

export const defaultConfig = {
  targetPatterns: ["**/*.y?(a)ml"],
  schemaPatterns: ["**/*.schema.y?(a)ml"],
  schemasOnly: false
};

export const version = require("../../package.json").version;
