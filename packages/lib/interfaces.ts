////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/** An object mapping string keys to string values */
export type StringsMap = { [key in string]: string };

/** Like `StringsMap` but read-only */
export type ReadOnlyStringsMap = Readonly<StringsMap>;

export type ImmutableFullyOptional<Original> = {
  +readonly [key in keyof Original]+?: Original[key] | null | undefined;
};
