# Scheyaml

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
