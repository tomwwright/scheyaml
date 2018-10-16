import { version } from "./config";

test("version matches SemVer", () => {
  expect(version).toMatch(/\d+\.\d+\.\d+/);
});
