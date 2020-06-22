import { CachedProperty } from './oop';

describe('oop', () => {
  describe('CachedProperty', () => {
    it('should cache getter', () => {
      let counter = 0;
      class A {
        @CachedProperty()
        get property() {
          counter++;
          return 'value';
        }
      }
      const a = new A();

      expect(counter).toBe(0);

      expect(a.property).toBe('value');
      expect(counter).toBe(1);

      expect(a.property).toBe('value');
      expect(counter).toBe(1);
    });

    it('should cache regular functions', () => {
      let counter = 0;
      class A {
        @CachedProperty()
        getProperty() {
          counter++;
          return 'value';
        }
      }
      const a = new A();

      expect(counter).toBe(0);

      expect(a.getProperty()).toBe('value');
      expect(counter).toBe(1);

      expect(a.getProperty()).toBe('value');
      expect(counter).toBe(1);
    });
  });
});
