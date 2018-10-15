import Ajv from "ajv";
import { loadSchema, inflateSchema, loadTarget } from "./schema";
import { ScheyamlDirectiveError, ScheyamlUnknownSchemaError } from "./errors";

export interface IScheyamlValidation {
  isValid: boolean;
  passes: Array<{
    schemaId: string;
  }>;
  failures: Array<{
    schemaId: string;
    errors: Ajv.ErrorObject[];
  }>;
}

export class Scheyaml {
  private validator = new Ajv({
    allErrors: true
  });

  public addSchema(filePath: string): string {
    const schema = loadSchema(filePath);

    const inflatedSchema = inflateSchema(schema.json);
    this.validator.addSchema(inflatedSchema, schema.schemaId);

    return schema.schemaId;
  }

  public validate(targetPath: string) {
    const { json, schemaIds } = loadTarget(targetPath);

    if (schemaIds.length === 0) {
      throw new ScheyamlDirectiveError(`File '${targetPath}' contains no schema directives!`);
    }

    const validation: IScheyamlValidation = {
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
            schemaId,
            errors: schemaValidator.errors
          });
        }
      }
    }

    return validation;
  }
}
