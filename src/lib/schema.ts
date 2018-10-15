import Ajv from "ajv";
import fs from "fs";
import yamljs from "yamljs";

import * as ui from "./ui";
import { extractDirectives, dump } from "./utils";

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

export class SchemaDirectiveError extends Error {
  constructor(message) {
    super(message);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, SchemaDirectiveError.prototype);
  }
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

export function loadSchemas(filePaths: string[]) {
  const validator = new Ajv({
    allErrors: true
  });

  for (const schemaFilePath of filePaths) {
    try {
      const schema = loadSchema(schemaFilePath);

      const inflatedSchema = inflateSchema(schema.json);
      validator.addSchema(inflatedSchema, schema.schemaId);
      ui.loadedSchemaOk(schema.schemaId, schemaFilePath);
    } catch (e) {
      if (e instanceof SchemaDirectiveError) {
        ui.loadedSchemaNoId(schemaFilePath);
      } else {
        throw e;
      }
    }
  }

  return validator;
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
