////////////////////////////////////////////////////////////////////////////////
// Models
////////////////////////////////////////////////////////////////////////////////

/**
 * A single value or a virtually unlimitedly nested array of this type of value
 */
export type RecursiveArray<T> = T | Array<RecursiveArray<T>>;

////////////////////////////////////////////////////////////////////////////////
// Complex transformations
////////////////////////////////////////////////////////////////////////////////

export const flatten = <T>(input: RecursiveArray<T>): T[] => {
  if (!Array.isArray(input)) { return [input]; }
  return input.map(flatten).flat();
};

////////////////////////////////////////////////////////////////////////////////
// Array to String
////////////////////////////////////////////////////////////////////////////////


/**
 * A virtually unlimitedly nested array of values, including void and non-void ones
 */
export type NonSanitizedArray<T = any> = RecursiveArray<T | null | undefined>;
/**
 * A non-nested array of non void values
 */
export type SanitizedArray<T = any> = Array<Exclude<T, null | undefined | Array<any>>>;

/**
 * Turns the `NonSanitizedArray` `array` into a `SanitizedArray`
 */
export const sanitize = <T>(array: NonSanitizedArray<T>): SanitizedArray<T> =>
  flatten(array).filter(value => value != null) as any;
