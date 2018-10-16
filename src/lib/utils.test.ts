import glob from "glob";
import { mocked } from "ts-jest/utils";
import * as utils from "./utils";

const mockedGlob = mocked(glob, true);
jest.mock("glob");

describe("globFiles", () => {
  const mockGlobs = {
    "**/*.yml": ["a.yml", "b.yml", "dir/a.yml", "dir/b.yml"],
    "*.yml": ["a.yml", "b.yml"],
    "**/b.yml": ["dir/b.yml"],
    "c.yml": []
  };

  beforeAll(() => {
    mockedGlob.sync.mockImplementation((pattern: string) => mockGlobs[pattern]);
  });

  afterAll(() => {
    mockedGlob.sync.mockRestore();
  });

  it("flattens and returns unique files", () => {
    expect(utils.globFiles(["*.yml", "**/b.yml"])).toEqual(["a.yml", "b.yml", "dir/b.yml"]);
    expect(mockedGlob.sync).toHaveBeenCalledWith("*.yml");
    expect(mockedGlob.sync).toHaveBeenCalledWith("**/b.yml");
    expect(utils.globFiles(["**/*.yml", "**/b.yml"])).toEqual(["a.yml", "b.yml", "dir/a.yml", "dir/b.yml"]);
    expect(mockedGlob.sync).toHaveBeenCalledWith("**/*.yml");
    expect(mockedGlob.sync).toHaveBeenCalledWith("**/b.yml");
    expect(utils.globFiles(["c.yml"])).toEqual([]);
    expect(mockedGlob.sync).toHaveBeenCalledWith("c.yml");
  });

  it("returns an empty array for no patterns", () => {
    expect(utils.globFiles([])).toEqual([]);
  });
});
