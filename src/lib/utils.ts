import glob from "glob";
import _ from "lodash";

export function dump(json: any) {
  return JSON.stringify(json, null, 2);
}

export function globFiles(patterns: string[]) {
  return _.flatten(patterns.map(pattern => glob.sync(pattern)));
}

export function extractDirectives(text: string) {
  const directiveMatch = text.match(/## [\_\-a-zA-Z0-9]+: [\_\-a-zA-Z0-9]+/g) || [];
  if (!directiveMatch) {
    return [];
  }
  return directiveMatch.map(directive => ({
    key: directive.substring(3, directive.indexOf(":")),
    value: directive.substring(directive.lastIndexOf(":") + 2)
  }));
}
