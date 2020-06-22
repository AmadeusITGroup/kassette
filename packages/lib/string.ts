// -------------------------------------------------------------------- internal

import {
  sanitize,
  NonSanitizedArray,
} from './array';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

/** Sanitizes the given array of `parts` (flattening and rejecting void values) and joins the resulting parts into a string */
export const safeBuildString = <T>(parts: NonSanitizedArray<T>): string => sanitize(parts).join('');
