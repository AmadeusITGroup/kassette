////////////////////////////////////////////////////////////////////////////////
// Caching property
////////////////////////////////////////////////////////////////////////////////

/**
 * Stores the result of the first call to the getter and returns that result directly for subsequent calls
 *
 * Applies to: class getters
 */
export const CachedProperty =
  <T = any>() =>
  (_target: Object, _propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => {
    const descriptorKey = descriptor.value != null ? 'value' : 'get';
    const method = descriptor[descriptorKey];

    const values = new Map<any, T>();
    descriptor[descriptorKey] = function (this: any, ...args: any[]): T {
      let value;
      if (values.has(this)) {
        value = values.get(this);
      } else {
        value = (method as any).apply(this, args);
        values.set(this, value);
      }
      return value;
    } as any;
  };
