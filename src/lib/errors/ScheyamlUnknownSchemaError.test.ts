import { ScheyamlUnknownSchemaError } from "./ScheyamlUnknownSchemaError";

test("ScheyamlUnknownSchemaError", () => {
  const error = new ScheyamlUnknownSchemaError("schemaid", "message");

  expect(error instanceof ScheyamlUnknownSchemaError).toEqual(true);
  expect(error.schemaId).toEqual("schemaid");
});
