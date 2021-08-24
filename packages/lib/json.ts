/** Serializes given `value` into JSON using a 4 spaces indentation */
export const stringifyPretty = (value: any): string => JSON.stringify(value, null, 4);
