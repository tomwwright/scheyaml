export class ScheyamlError extends Error {
  constructor(message) {
    super(message);

    // Set the prototype explicitly: https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, SchemaDirectiveError.prototype);
  }
}

export class SchemaDirectiveError extends ScheyamlError {}
export class ScheyamlUnknownSchemaError extends ScheyamlError {
  public schemaId: string;

  constructor(schemaId: string, message) {
    super(message);
    this.schemaId = schemaId;
  }
}
