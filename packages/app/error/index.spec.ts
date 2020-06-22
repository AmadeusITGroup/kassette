import {
  TYPE, AppError, isAppError,
  FileConfigurationError,
  ServerError,
  MissingRemoteURLError,
} from './';



////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('Errors', () => {
  describe('AppError', () => {
    it('should instantiate', () => {
      const originalMessage = 'original message';
      const newMessage = 'new message';
      const originalError = new Error(originalMessage);
      const type: TYPE = 'file_configuration';
      const error = new AppError(originalError, type, newMessage);

      expect(isAppError(error)).toBeTruthy();
      expect(error.original).toBe(originalError);
      expect(error.type).toBe(type);
      expect(error.message).toBe(newMessage);
    });
  });

  describe('FileConfigurationError', () => {
    it('should instantiate', () => {
      const originalError = new Error('original message');
      const path = 'my/dummy/path';
      const error = new FileConfigurationError(originalError, path);

      expect(isAppError(error)).toBeTruthy();
      expect(error.original).toBe(originalError);
      expect(error.type).toBe('file_configuration');
      expect(error.name).toBe('FileConfigurationError');
      expect(error.message).toContain(path);
    });
  });

  describe('ServerError', () => {
    it('should instantiate', () => {
      const originalError = new Error('original message');
      const error = new ServerError(originalError);

      expect(isAppError(error)).toBeTruthy();
      expect(error.original).toBe(originalError);
      expect(error.type).toBe('server_error');
      expect(error.name).toBe('ServerError');
    });
  });

  describe('MissingRemoteURLError', () => {
    it('should instantiate', () => {
      const error = new MissingRemoteURLError();

      expect(isAppError(error)).toBeTruthy();
      expect(error.type).toBe('missing_remote_url');
      expect(error.name).toBe('MissingRemoteURLError');
    });
  });
});
