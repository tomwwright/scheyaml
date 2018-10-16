import { ScheyamlDirectiveError } from "./ScheyamlDirectiveError";

test("ScheyamlDirectiveError", () => {
  const error = new ScheyamlDirectiveError("message");

  expect(error instanceof ScheyamlDirectiveError).toEqual(true);
});
