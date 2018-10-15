import { CustomError } from "./CustomError";

export class ScheyamlUnknownSchemaError extends CustomError {
  constructor(public schemaId: string, message) {
    super(ScheyamlUnknownSchemaError.prototype, message);
  }
}
