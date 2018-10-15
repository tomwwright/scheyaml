import Ajv from "ajv";
import fs from "fs";
import yamljs from "yamljs";

import { SchemaDirectiveError, ScheyamlUnknownSchemaError } from "./errors";
import { extractDirectives } from "./utils";

export function loadFile(path: string) {
  const text = fs.readFileSync(path).toString();
  const directives = extractDirectives(text);
  return {
    json: yamljs.parse(text),
    directives
  };
}

export function loadTarget(path: string) {
  const { json, directives } = loadFile(path);
  const schemaIds = directives.filter(directive => directive.key == "schema").map(directive => directive.value);
  return {
    json,
    schemaIds
  };
}

export function loadSchema(path: string) {
  const { json, directives } = loadFile(path);
  const schemaIds = directives.filter(directive => directive.key == "id");
  if (schemaIds.length == 0) {
    throw new SchemaDirectiveError(`File '${path}' does not contain a schema ID directive! ('## id: <schemaid>')`);
  } else if (schemaIds.length > 1) {
    throw new SchemaDirectiveError(`File '${path}' contains multiple schema ID directives! ('## id: <schemaid>')`);
  }

  return {
    json,
    schemaId: schemaIds[0].value
  };
}

export function inflateSchema(raw: any): Schema {
  if (typeof raw.type === "string") return raw;

  if (typeof raw === "string") {
    if (raw.endsWith("[]")) {
      return {
        type: "array",
        items: {
          type: raw.replace("[]", "")
        }
      };
    }
    return {
      type: raw
    };
  }

  if (raw instanceof Array) {
    return {
      enum: raw
    };
  }

  if (typeof raw === "object") {
    const inflated = {
      type: "object",
      properties: {},
      required: []
    };
    for (const property in raw) {
      inflated.properties[property] = inflateSchema(raw[property]);
      inflated.required.push(property);
    }
    return inflated;
  }

  return raw;
}

export interface Schema {
  id?: string;
  $schema?: string;
  $ref?: string;
  title?: string;
  description?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  additionalItems?: boolean | Schema;
  items?: Schema | Schema[];
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  additionalProperties?: boolean | Schema;
  definitions?: {
    [name: string]: Schema;
  };
  properties?: {
    [name: string]: Schema;
  };
  patternProperties?: {
    [name: string]: Schema;
  };
  dependencies?: {
    [name: string]: Schema | string[];
  };
  enum?: any[];
  type?: string | string[];
  format?: string;
  allOf?: Schema[];
  anyOf?: Schema[];
  oneOf?: Schema[];
  not?: Schema;
}

export interface ScheyamlValidation {
  isValid: boolean;
  passes: {
    schemaId: string;
  }[];
  failures: {
    schemaId: string;
    errors: Ajv.ErrorObject[];
  }[];
}
export class Scheyaml {
  private validator = new Ajv({
    allErrors: true
  });

  addSchema(filePath: string): string {
    const schema = loadSchema(filePath);

    const inflatedSchema = inflateSchema(schema.json);
    this.validator.addSchema(inflatedSchema, schema.schemaId);

    return schema.schemaId;
  }

  validate(targetPath: string) {
    const { json, schemaIds } = loadTarget(targetPath);

    if (schemaIds.length == 0) throw new SchemaDirectiveError(`File '${targetPath}' contains no schema directives!`);

    const validation: ScheyamlValidation = {
      isValid: true,
      passes: [],
      failures: []
    };

    for (const schemaId of schemaIds) {
      const schemaValidator = this.validator.getSchema(schemaId);
      if (!schemaValidator) {
        throw new ScheyamlUnknownSchemaError(schemaId, `File '${targetPath}' declares an unknown schema '${schemaId}!`);
      } else {
        const schemaValidation = schemaValidator(json);

        if (schemaValidation) {
          validation.passes.push({
            schemaId
          });
        } else {
          validation.isValid = false;
          validation.failures.push({
            schemaId: schemaId,
            errors: schemaValidator.errors
          });
        }
      }
    }

    return validation;
  }
}
