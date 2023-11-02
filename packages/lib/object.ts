////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

type ObjectMap<T> = { [key in string]: T };

export const isObject = <T>(value: any): value is ObjectMap<T> =>
  ({}).toString.call(value).slice(8, -1) === 'Object';

export const copyDeep = (object: Readonly<ObjectMap<any>>): ObjectMap<any> => {
  const copy: ObjectMap<any> = {};
  Object.entries(object).forEach(([key, value]) => {
    if (isObject(value)) {
      value = copyDeep(value);
    }
    copy[key] = value;
  });
  return copy;
};

export const mergeDeepLeft = (
  leftOriginal: Readonly<ObjectMap<any>>,
  right: Readonly<ObjectMap<any>>,
): ObjectMap<any> => {
  const left = copyDeep(leftOriginal);

  Object.entries(right).forEach(([key, rightValue]) => {
    if (!left.hasOwnProperty(key)) {
      left[key] = !isObject(rightValue) ? rightValue : copyDeep(rightValue);
    } else {
      const leftValue = left[key];
      if (isObject(leftValue) && isObject(rightValue)) {
        left[key] = mergeDeepLeft(leftValue, rightValue);
      }
    }
  });

  return left;
};

export const fromPairs = <T>(pairs: [string, T][]): ObjectMap<T> =>
  pairs.reduce<ObjectMap<T>>((output, [key, value]) => ((output[key] = value), output), {});

export const rejectVoid = <T = any>(object: ObjectMap<T>): ObjectMap<NonNullable<T>> =>
  fromPairs(Object.entries(object).filter(([_key, value]) => value != null)) as ObjectMap<
    NonNullable<T>
  >;
