////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/**
 * An object mapping string keys to string values
 *
 * @public
 */
export type StringsMap = { [key in string]: string };

/**
 * Like `StringsMap` but read-only
 *
 * @public
 */
export type ReadOnlyStringsMap = Readonly<StringsMap>;

/**
 * @public
 */
export type ImmutableFullyOptional<Original> = {
  +readonly [key in keyof Original]+?: Original[key] | null | undefined;
};
