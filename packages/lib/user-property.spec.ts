import { UserProperty } from './user-property';

describe('user property', () => {
  describe('input', () => {
    it('should return no input when not fed and no default', () => {
      const property = new UserProperty();

      const {input, inputOrigin} = property.inputAndOrigin;
      expect(input).toBeUndefined();
      expect(inputOrigin).toEqual('none');
      expect(property.input).toBeUndefined();
      expect(property.inputOrigin).toEqual('none');

      expect(property.userInputIsSet).toBe(false);
      expect(property.userInput).toBeUndefined();
      expect(property.hasDefaultInput).toBe(false);
      expect(property.defaultInput).toBeUndefined();
    });

    it('should return provided value when provided', () => {
      const value = 'hello';
      const property = new UserProperty();
      property.set(value);

      const {input, inputOrigin} = property.inputAndOrigin;
      expect(input).toEqual(value);
      expect(inputOrigin).toEqual('user');
      expect(property.input).toEqual(value);
      expect(property.inputOrigin).toEqual('user');

      expect(property.userInputIsSet).toBe(true);
      expect(property.userInput).toEqual(value);
      expect(property.hasDefaultInput).toBe(false);
      expect(property.defaultInput).toBeUndefined();
    });

    it('should be able to unset the value', () => {
      const value = 'hello';
      const property = new UserProperty();
      property.set(value);
      property.unset();

      const {input, inputOrigin} = property.inputAndOrigin;
      expect(input).toBeUndefined();
      expect(inputOrigin).toEqual('none');
      expect(property.input).toBeUndefined();
      expect(property.inputOrigin).toEqual('none');

      expect(property.userInputIsSet).toBe(false);
      expect(property.userInput).toBeUndefined();
      expect(property.hasDefaultInput).toBe(false);
      expect(property.defaultInput).toBeUndefined();
    });

    it('should return default input when not fed and has a default value handler', () => {
      const defaultValue = 'hello';
      const property = new UserProperty({getDefaultInput: () => defaultValue});

      expect(property.inputAndOrigin.input).toEqual(defaultValue);
      expect(property.inputAndOrigin.inputOrigin).toEqual('default');
      expect(property.input).toEqual(defaultValue);
      expect(property.inputOrigin).toEqual('default');

      expect(property.userInputIsSet).toBe(false);
      expect(property.userInput).toBeUndefined();
      expect(property.hasDefaultInput).toBe(true);
      expect(property.defaultInput).toEqual(defaultValue);

      const value = 'world';
      property.set(value);

      expect(property.inputAndOrigin.input).toEqual(value);
      expect(property.inputAndOrigin.inputOrigin).toEqual('user');
      expect(property.input).toEqual(value);
      expect(property.inputOrigin).toEqual('user');

      expect(property.userInputIsSet).toBe(true);
      expect(property.userInput).toEqual(value);
      expect(property.hasDefaultInput).toBe(true);
      expect(property.defaultInput).toEqual(defaultValue);
    });
  });

  describe('output', () => {
    it('should be input when no transformation done', () => {
      const property = new UserProperty();

      expect(property.output).toBeUndefined();
      const value = 'hello';
      property.set(value);
      expect(property.output).toBe(value);
      property.unset();
      expect(property.output).toBeUndefined();
    });

    it('should use the transformation when provided', () => {
      const property = new UserProperty({
        transform: ({input}) => '' + input,
      });

      expect(property.output).toBe('undefined');
      property.set(false);
      expect(property.output).toBe('false');
      property.unset();
      expect(property.output).toBe('undefined');
    });

    it('should use default input if needed for transformation', () => {
      const property = new UserProperty({
        getDefaultInput: () => true,
        transform: ({input}) => !input,
      });

      expect(property.output).toBe(false);
      property.set(false);
      expect(property.output).toBe(true);
      property.unset();
      expect(property.output).toBe(false);
    });
  });






  describe('cache', () => {
    it('should cache input value', () => {
      let callCount = 0;

      const defaultValue = 'hello';
      const property = new UserProperty({getDefaultInput: () => {
        callCount++;
        return defaultValue;
      }});

      expect(callCount).toBe(0);
      expect(property.input).toEqual(defaultValue);
      expect(callCount).toBe(1);
      expect(property.input).toEqual(defaultValue);
      expect(callCount).toBe(1);

      const value = 'world';
      property.set(value);
      expect(property.input).toEqual(value);
      expect(callCount).toBe(1);

      property.unset();
      expect(property.input).toEqual(defaultValue);
      expect(callCount).toBe(2);

      property.resetInputCache();
      expect(property.input).toEqual(defaultValue);
      expect(callCount).toBe(3);
    });

    it('should cache output value', () => {
      let callCount = 0;

      const property = new UserProperty({transform: ({input}) => {
        callCount++;
        return '' + input;
      }});

      expect(callCount).toBe(0);
      expect(property.output).toEqual('undefined');
      expect(callCount).toBe(1);
      expect(property.output).toEqual('undefined');
      expect(callCount).toBe(1);

      property.set(false);
      expect(property.output).toEqual('false');
      expect(callCount).toBe(2);
      expect(property.output).toEqual('false');
      expect(callCount).toBe(2);

      property.unset();
      expect(property.output).toEqual('undefined');
      expect(callCount).toBe(3);

      property.resetInputCache();
      expect(property.output).toEqual('undefined');
      expect(callCount).toBe(4);

      property.resetOutputCache();
      expect(property.output).toEqual('undefined');
      expect(callCount).toBe(5);
    });
  });
});
