////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * @public
 */
export type JSONData = Exclude<any, undefined | Function>;

/** Serializes given `value` into JSON using a 4 spaces indentation */
export const stringifyPretty = (value: JSONData): string => JSON.stringify(value, null, 4);
