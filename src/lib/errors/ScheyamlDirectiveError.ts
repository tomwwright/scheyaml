import { CustomError } from "./CustomError";
export class ScheyamlDirectiveError extends CustomError {
  constructor(message) {
    super(ScheyamlDirectiveError.prototype, message);
  }
}
