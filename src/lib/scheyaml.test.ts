import { Scheyaml } from "./scheyaml";
import { mocked } from "ts-jest/utils";

import * as schema from "./schema";
import { ScheyamlDirectiveError, ScheyamlUnknownSchemaError } from "./errors";

describe(".addSchema", () => {
  it("loads a schema", () => {
    const mockFilename = "schema.yml";
    const spy = jest.spyOn(schema, "loadSchema").mockImplementation(() => ({
      json: {
        test: "string"
      },
      schemaId: "testid"
    }));

    const scheyaml = new Scheyaml();
    const schemaId = scheyaml.addSchema(mockFilename);

    expect(schemaId).toEqual("testid");

    spy.mockRestore();
  });

  it("throws an exception if the schema is invalid", () => {
    const mockFilename = "schema.yml";
    const spy = jest.spyOn(schema, "loadSchema").mockImplementation(() => ({
      json: {
        test: "badtype"
      },
      schemaId: "testid"
    }));

    const scheyaml = new Scheyaml();
    expect(() => scheyaml.addSchema(mockFilename)).toThrowError();

    spy.mockRestore();
  });
});

describe(".validate", () => {
  it("validates a schema of a target", () => {
    const loadSchemaSpy = jest.spyOn(schema, "loadSchema").mockImplementation(() => ({
      json: {
        test: "string"
      },
      schemaId: "testid"
    }));

    const scheyaml = new Scheyaml();
    const loadedSchemaId = scheyaml.addSchema("schema.yml");
    expect(loadedSchemaId).toEqual("testid");

    const loadTargetSpy = jest.spyOn(schema, "loadTarget").mockImplementation(() => ({
      json: {
        test: "stringvalue"
      },
      schemaIds: ["testid"]
    }));

    const validation = scheyaml.validate("target.yml");
    expect(validation.isValid).toEqual(true);
    expect(validation.failures.length).toEqual(0);
    expect(validation.passes.length).toEqual(1);
    expect(validation.passes[0].schemaId).toEqual("testid");

    loadSchemaSpy.mockRestore();
    loadTargetSpy.mockRestore();
  });

  it("validates multiple schemas of a target", () => {
    const loadSchemaSpy = jest.spyOn(schema, "loadSchema").mockImplementation((filename: string) => {
      switch (filename) {
        case "stringschema.yml":
          return {
            json: {
              test: "string"
            },
            schemaId: "stringschema"
          };
        case "numberschema.yml":
          return {
            json: {
              count: "number"
            },
            schemaId: "numberschema"
          };
      }
    });

    const scheyaml = new Scheyaml();
    const loadedStringSchemaId = scheyaml.addSchema("stringschema.yml");
    expect(loadedStringSchemaId).toEqual("stringschema");

    const loadedNumberSchemaId = scheyaml.addSchema("numberschema.yml");
    expect(loadedNumberSchemaId).toEqual("numberschema");

    const loadTargetSpy = jest.spyOn(schema, "loadTarget").mockImplementation(() => ({
      json: {
        test: "stringvalue",
        count: 3
      },
      schemaIds: ["stringschema", "numberschema"]
    }));

    const validation = scheyaml.validate("target.yml");
    expect(validation.isValid).toEqual(true);
    expect(validation.failures.length).toEqual(0);
    expect(validation.passes.length).toEqual(2);
    expect(validation.passes.map(pass => pass.schemaId)).toEqual(["stringschema", "numberschema"]);

    loadSchemaSpy.mockRestore();
    loadTargetSpy.mockRestore();
  });

  it("validates multiple schemas of a target -- failure", () => {
    const loadSchemaSpy = jest.spyOn(schema, "loadSchema").mockImplementation((filename: string) => {
      switch (filename) {
        case "stringschema.yml":
          return {
            json: {
              test: "string"
            },
            schemaId: "stringschema"
          };
        case "numberschema.yml":
          return {
            json: {
              count: "number"
            },
            schemaId: "numberschema"
          };
      }
    });

    const scheyaml = new Scheyaml();
    const loadedStringSchemaId = scheyaml.addSchema("stringschema.yml");
    expect(loadedStringSchemaId).toEqual("stringschema");

    const loadedNumberSchemaId = scheyaml.addSchema("numberschema.yml");
    expect(loadedNumberSchemaId).toEqual("numberschema");

    const loadTargetSpy = jest.spyOn(schema, "loadTarget").mockImplementation(() => ({
      json: {
        test: "stringvalue",
        count: "badtype"
      },
      schemaIds: ["stringschema", "numberschema"]
    }));

    const validation = scheyaml.validate("target.yml");
    expect(validation.isValid).toEqual(false);
    expect(validation.failures.length).toEqual(1);
    expect(validation.passes.length).toEqual(1);
    expect(validation.passes[0].schemaId).toEqual("stringschema");
    expect(validation.failures[0].schemaId).toEqual("numberschema");
    expect(validation.failures[0].errors.length).toEqual(1);
    expect(validation.failures[0].errors[0]).toEqual({
      keyword: "type",
      dataPath: ".count",
      schemaPath: "#/properties/count/type",
      params: { type: "number" },
      message: "should be number"
    });

    loadSchemaSpy.mockRestore();
    loadTargetSpy.mockRestore();
  });

  it("validates a schema of a target -- failure", () => {
    const loadSchemaSpy = jest.spyOn(schema, "loadSchema").mockImplementation(() => ({
      json: {
        test: "string"
      },
      schemaId: "stringschema"
    }));

    const scheyaml = new Scheyaml();
    const loadedSchemaId = scheyaml.addSchema("stringschema.yml");
    expect(loadedSchemaId).toEqual("stringschema");

    const loadTargetSpy = jest.spyOn(schema, "loadTarget").mockImplementation(() => ({
      json: {
        test: 3
      },
      schemaIds: ["stringschema"]
    }));

    const validation = scheyaml.validate("target.yml");
    expect(validation.isValid).toEqual(false);
    expect(validation.failures.length).toEqual(1);
    expect(validation.passes.length).toEqual(0);
    expect(validation.failures[0].schemaId).toEqual("stringschema");
    expect(validation.failures[0].errors.length).toEqual(1);
    expect(validation.failures[0].errors[0]).toEqual({
      keyword: "type",
      dataPath: ".test",
      schemaPath: "#/properties/test/type",
      params: { type: "string" },
      message: "should be string"
    });

    loadSchemaSpy.mockRestore();
    loadTargetSpy.mockRestore();
  });

  it("throws an exception if schema of target is unknown", () => {
    const mockFilename = "target.yml";
    const spy = jest.spyOn(schema, "loadTarget").mockImplementation(() => ({
      json: {
        test: "string"
      },
      schemaIds: ["testid"]
    }));

    const scheyaml = new Scheyaml();
    expect(() => scheyaml.validate(mockFilename)).toThrowError(ScheyamlUnknownSchemaError);
  });

  it("throws an exception if target declares no schema", () => {
    const mockFilename = "target.yml";
    const spy = jest.spyOn(schema, "loadTarget").mockImplementation(() => ({
      json: {
        test: "string"
      },
      schemaIds: []
    }));

    const scheyaml = new Scheyaml();
    expect(() => scheyaml.validate(mockFilename)).toThrowError(ScheyamlDirectiveError);
  });
});
