import fs from "fs";
import yamljs from "yamljs";

import * as schema from "./schema";
import { ScheyamlDirectiveError, ScheyamlUnknownSchemaError } from "./errors";
import { extractDirectives } from "./utils";

export function loadFile(path: string) {
  const text = fs.readFileSync(path).toString();
  const directives = extractDirectives(text);
  return {
    directives,
    json: yamljs.parse(text)
  };
}

export function loadTarget(path: string) {
  const { json, directives } = schema.loadFile(path);
  const schemaIds = directives.filter(directive => directive.key === "schema").map(directive => directive.value);
  return {
    json,
    schemaIds
  };
}

export function loadSchema(path: string) {
  const { json, directives } = schema.loadFile(path);
  const schemaIds = directives.filter(directive => directive.key === "id");
  if (schemaIds.length === 0) {
    throw new ScheyamlDirectiveError(`File '${path}' does not contain a schema ID directive!`);
  } else if (schemaIds.length > 1) {
    throw new ScheyamlDirectiveError(`File '${path}' contains multiple schema ID directives!`);
  }

  return {
    json,
    schemaId: schemaIds[0].value
  };
}

export function inflateSchema(raw: any): ISchema {
  if (typeof raw === "string") {
    if (raw.endsWith("[]")) {
      return {
        type: "array",
        items: {
          type: raw.replace("[]", "")
        }
      };
    }
    if (["string", "number", "boolean"].indexOf(raw) >= 0) {
      return {
        type: raw
      };
    }
    return {
      type: "enum",
      enum: [raw]
    };
  }

  if (raw instanceof Array) {
    return {
      type: "enum",
      enum: raw
    };
  }

  if (typeof raw.type === "string") {
    return raw;
  }

  if (typeof raw === "object") {
    const inflated = {
      type: "object",
      properties: {},
      required: []
    };
    for (const key of Object.keys(raw)) {
      inflated.properties[key] = schema.inflateSchema(raw[key]);
      inflated.required.push(key);
    }
    return inflated;
  }

  return raw;
}

export interface ISchema {
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
  additionalItems?: boolean | ISchema;
  items?: ISchema | ISchema[];
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  additionalProperties?: boolean | ISchema;
  definitions?: {
    [name: string]: ISchema;
  };
  properties?: {
    [name: string]: ISchema;
  };
  patternProperties?: {
    [name: string]: ISchema;
  };
  dependencies?: {
    [name: string]: ISchema | string[];
  };
  enum?: any[];
  type?: string | string[];
  format?: string;
  allOf?: ISchema[];
  anyOf?: ISchema[];
  oneOf?: ISchema[];
  not?: ISchema;
}
