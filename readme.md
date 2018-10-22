# scheYAML

> Straightforward schema validation for YAML

Create your schema as `person.schema.yml` and give it an identifier:

```yml
## id: person
---
name: string
age: number

hobbies: string[]

address:
  streetNumber: number
  street: string
  suburb: string
  postcode: number
  state:
    - NSW
    - QLD
    - VIC
    - SA
    - ACT
    - TAS
    - WA
    - NT
```

Tag your target YAMLs with the schema identifier:

```yml
## schema: person
---
name: Fred
age: 35

hobbies: []

address:
  streetNumber: 120
  street: Street St
  suburb: Exampleville
  postcode: 1000
  state: NSW
```

```yml
## schema: person
---
name: George
age: "Thirty-two"

address:
  streetNumber: 120
  street: Street St
  suburb: Exampleville
  postcode: 1000
  state: BadState
```

Run `scheyaml`

```
> scheyaml
scheyaml v0.0.2

Globbing schemas... Found 1 schemas!

OK      Loaded 'person' from 'examples/schemas/person.schema.yml'

Globbing targets... Found 2 targets!

OK      Schema 'person' validated by 'examples/targets/fred.yml'
FAIL    Schema 'person' failed by 'examples/targets/george.yml'

✖ Schema 'person' for 'examples/targets/george.yml':

    type: .age should be number

    required:  should have required property 'hobbies'

    enum: .address.state should be equal to one of the allowed values

== ✖ 1 passed, 1 failed (3 errors) ==

✔ Done!
```

## Installing

For use from the CLI, simply install `scheyaml` as a global `npm` module:

```bash
npm install -g scheyaml
# or
yarn global add scheyaml
```

For use as a module, `scheyaml` can be installed into a package:

```bash
npm install --save scheyaml
# or
yarn add scheyaml
```

## Usage

### Usage in CLI

The `scheayaml` CLI exposes a very simple API:

```
> scheyaml --help
Usage: scheyaml [options]

Options:
  -V, --version          output the version number
  -t --targets <target>  add a glob pattern for validation targets (default: ["**/*.y?(a)ml"])
  -s --schemas <glob>    add a glob pattern for schemas (default: ["**/*.schema.y?(a)ml"])
  -e --exclude <glob>    add a glob pattern to exclude from schemas and targets (default: [])
  --schemas-only         only load and validate schemas
  -h, --help             output usage information
```

#### `--version -V`

Output `scheyaml` version and exit

```
> scheyaml --version
0.0.2
```

#### `--schemas-only`

Performs only loading and verification of schema files (skips target validation)

```
> scheyaml --schemas-only
scheyaml v0.0.2

Globbing schemas... Found 1 schemas!

OK      Loaded 'person' from 'examples/schemas/person.schema.yml'

✔ Done!
```

#### `--schemas <glob>`, `-s <glob>`

Override the glob patterns for finding schemas to use in validation. Can be specified multiple times to add multiple globs.

**NOTE** Add quotes around the glob to avoid shell expansion

```
> scheyaml --schemas '**/schemas/*.yml'
# globs for schemas by '**/schemas/*.yml' instead of the
# default of '**/*.schema.y?(a)ml'
```

```
> scheyaml --schemas '**/schemas/*.yml' --schemas '../otherschemas/*.yml'
# globs for schemas by:
#   '**/schemas/*.yml'
#   and
#   '../otherschemas/*.yml'
```

#### `--targets <glob>`, `-t <glob>`

Override the glob patterns for finding target files for validation. Can be specified multiple times to add multiple globs.

**NOTE** Add quotes around the glob to avoid shell expansion

**NOTE** Files matching schemas globs are automatically excluded from target globs

```
> scheyaml --targets '**/targets/*.yml'
# globs for targets by '**/targets/*.yml' instead of the
# default of '**/*.y?(a)ml'
```

```
> scheyaml --targets '**/targets/*.yml' --targets '../othertargets/*.yml'
# globs for targets by:
#   '**/targets/*.yml'
#   and
#   '../othertargets/*.yml'
```

#### `--exclude <glob>`, `-e <glob>`

Add glob patterns to exclude files from being targets or schemas

**NOTE** Add quotes around the glob to avoid shell expansion

```
> scheyaml --exclude 'node_modules/**/*.yml`
# exclude any .yml files in node_modules from being picked
# up as schemas or targets
```

### Usage as module

Import the `scheyaml` library module and instantiate:

```js
import { Scheyaml } from "scheyaml/lib/scheyaml";
// or
const { Scheyaml } = require("scheyaml/lib");

const scheyaml = new Scheyaml();
```

#### `scheyaml.addSchema(filePath: string): string`

Load a schema from `filePath` into the validator and return the identifier of the loaded schema

```js
const schemaId = scheyaml.addSchema("person.schema.yml");
```

Throws exceptions if:

- the file is not valid YAML
- has no declaration of a schema identifier (see [Defining schemas](#defining-schemas))

```js
scheyaml.addSchema("badsyntax.schema.yml");
// Thrown: <ParseException> Unable to parse. (line 1: '<file contents>')

scheyaml.addSchema("noidentifier.schema.yml");
// Error: File 'examples/schemas/noid.schema.yml' does not contain a schema ID directive!
```

#### `scheyaml.validate(filePath: string): IScheyamlValidation`

Load a target from `filePath` and validate it against any schemas it declares. `scheyaml` uses [ajv](https://www.npmjs.com/package/ajv) under the hood, so any validation errors are simply returned in that format (see https://www.npmjs.com/package/ajv#validation-errors)

```js
const validation = scheyaml.validate("fred.yml");
```

```js
// type of the validation
export interface IScheyamlValidation {
  isValid: boolean;
  passes: Array<{
    schemaId: string
  }>;
  failures: Array<{
    schemaId: string,
    errors: Ajv.ErrorObject[]
  }>;
}
```

Throws an error if file:

- is not valid YAML
- has no schemas declared (see [Defining targets](#defining-targets))
- declares an unknown schema identifier (hasn't been added with `addSchema`)

```js
scheyaml.validate("badsyntax.yml");
// Thrown: <ParseException> Unable to parse. (line 1: '<file contents>')

scheyaml.validate("noschemas.yml");
// Error: File 'noschema.yml' contains no schema directives!

scheyaml.validate("fred.yml");
// Error: File 'fred.yml' declares an unknown schema 'person'!
```

## Defining schemas

## Defining targets
