import { mocked } from "ts-jest/utils";
import fs from "fs";

import * as schema from "./schema";
import { ScheyamlDirectiveError } from "./errors";

const mockedFs = mocked(fs);
jest.mock("fs");

describe("loadFile", () => {
  it("returns parsed YAML and directives", () => {
    const mockFilename = "testfile.yml";
    const mockFile = "## directive: directivevalue\n## otherdirective: otherdirectivevalue\ntest: file";
    mockedFs.readFileSync.mockImplementation(() => mockFile);

    const returned = schema.loadFile(mockFilename);

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(mockFilename);
    expect(returned.json).toEqual({
      test: "file"
    });
    expect(returned.directives).toEqual([
      {
        key: "directive",
        value: "directivevalue"
      },
      {
        key: "otherdirective",
        value: "otherdirectivevalue"
      }
    ]);

    mockedFs.readFileSync.mockRestore();
  });

  it("throws exception on bad YAML", () => {
    const mockFilename = "testfile.yml";
    const mockFile =
      "## directive: directivevalue\n## otherdirective: otherdirectivevalue\ntest:\n  nested: value\n  bad";
    mockedFs.readFileSync.mockImplementation(() => mockFile);

    expect(() => {
      schema.loadFile(mockFilename);
    }).toThrowError();

    mockedFs.readFileSync.mockRestore();
  });
});

describe("loadSchema", () => {
  let loadFileSpy: jest.Mock;
  afterEach(() => {
    loadFileSpy.mockRestore();
  });

  it("returns parsed file and schema id", () => {
    const mockFilename = "testfile.yml";
    const mockJson = {
      test: "file"
    };
    const mockDirectives = [
      {
        key: "id",
        value: "test"
      }
    ];

    loadFileSpy = jest.spyOn(schema, "loadFile").mockImplementation(() => ({
      json: mockJson,
      directives: mockDirectives
    }));

    const returned = schema.loadSchema(mockFilename);

    expect(loadFileSpy).toHaveBeenCalledWith(mockFilename);
    expect(returned.json).toEqual(mockJson);
    expect(returned.schemaId).toEqual("test");
  });

  it("throws ScheyamlDirectiveError without id directive", () => {
    const mockFilename = "testfile.yml";
    const mockJson = {
      test: "file"
    };
    const mockDirectives = [];

    loadFileSpy = jest.spyOn(schema, "loadFile").mockImplementation(() => ({
      json: mockJson,
      directives: mockDirectives
    }));

    expect(() => {
      schema.loadSchema(mockFilename);
    }).toThrow(ScheyamlDirectiveError);
  });

  it("throws ScheyamlDirectiveError with multiple id directives", () => {
    const mockFilename = "testfile.yml";
    const mockJson = {
      test: "file"
    };
    const mockDirectives = [
      {
        key: "id",
        value: "test"
      },
      {
        key: "id",
        value: "moretest"
      }
    ];

    loadFileSpy = jest.spyOn(schema, "loadFile").mockImplementation(() => ({
      json: mockJson,
      directives: mockDirectives
    }));

    expect(() => {
      schema.loadSchema(mockFilename);
    }).toThrow(ScheyamlDirectiveError);
  });
});

describe("loadTarget", () => {
  let loadFileSpy: jest.Mock;
  afterEach(() => {
    loadFileSpy.mockRestore();
  });

  it("returns parsed file and schema ids", () => {
    const mockFilename = "testfile.yml";
    const mockJson = {
      test: "file"
    };
    const mockDirectives = [
      {
        key: "schema",
        value: "test"
      },
      {
        key: "schema",
        value: "moretest"
      },
      {
        key: "otherdirective",
        value: "otherdirectivevalue"
      }
    ];

    loadFileSpy = jest.spyOn(schema, "loadFile").mockImplementation(() => ({
      json: mockJson,
      directives: mockDirectives
    }));

    const returned = schema.loadTarget(mockFilename);

    expect(loadFileSpy).toHaveBeenCalledWith(mockFilename);
    expect(returned.json).toEqual(mockJson);
    expect(returned.schemaIds).toEqual(["test", "moretest"]);
  });
});

describe("inflateSchema", () => {
  it("inflates primitives", () => {
    expect(schema.inflateSchema("string")).toEqual({
      type: "string"
    });
    expect(schema.inflateSchema("number")).toEqual({
      type: "number"
    });
    expect(schema.inflateSchema("boolean")).toEqual({
      type: "boolean"
    });
  });

  it("inflates primitive arrays", () => {
    expect(schema.inflateSchema("string[]")).toEqual({
      type: "array",
      items: {
        type: "string"
      }
    });
    expect(schema.inflateSchema("number[]")).toEqual({
      type: "array",
      items: {
        type: "number"
      }
    });
    expect(schema.inflateSchema("boolean[]")).toEqual({
      type: "array",
      items: {
        type: "boolean"
      }
    });
  });

  it("inflates enums", () => {
    expect(schema.inflateSchema(["1", "2", "3"])).toEqual({
      type: "enum",
      enum: ["1", "2", "3"]
    });
    expect(schema.inflateSchema(["1", 2, false])).toEqual({
      type: "enum",
      enum: ["1", 2, false]
    });
  });

  it("inflates objects", () => {
    expect(
      schema.inflateSchema({
        string: "string",
        number: "number",
        object: {
          nestedstring: "string",
          nestedboolean: "boolean",
          nestedlist: "string[]",
          nestedenum: ["1", "2"]
        }
      })
    ).toEqual({
      type: "object",
      required: ["string", "number", "object"],
      properties: {
        string: {
          type: "string"
        },
        number: {
          type: "number"
        },
        object: {
          type: "object",
          required: ["nestedstring", "nestedboolean", "nestedlist", "nestedenum"],
          properties: {
            nestedstring: {
              type: "string"
            },
            nestedboolean: {
              type: "boolean"
            },
            nestedlist: {
              type: "array",
              items: {
                type: "string"
              }
            },
            nestedenum: {
              type: "enum",
              enum: ["1", "2"]
            }
          }
        }
      }
    });
  });

  it("returns existing jsonschema unchanged", () => {
    let existingSchema: schema.ISchema = {
      type: "object",
      properties: {
        nested: {
          type: "string"
        }
      },
      required: ["nested"]
    };

    expect(schema.inflateSchema(existingSchema)).toEqual(existingSchema);

    existingSchema = {
      type: "enum",
      enum: [
        "value1",
        "value2",
        false,
        {
          a: "b"
        }
      ]
    };
    expect(schema.inflateSchema(existingSchema)).toEqual(existingSchema);
  });
});
