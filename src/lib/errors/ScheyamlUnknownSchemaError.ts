import { ScheyamlError } from "./ScheyamlError";

export class ScheyamlUnknownSchemaError extends ScheyamlError {
  public schemaId: string;

  constructor(schemaId: string, message) {
    super(message);
    this.schemaId = schemaId;
  }
}
