import { nameToSubjectAltName } from './certs';

describe('tls certificates', () => {
  describe('nameToSubjectAltName', () => {
    it('should work for DNS', () => {
      expect(nameToSubjectAltName('www.google.fr')).toEqual({
        type: 2,
        value: 'www.google.fr',
      });
    });

    it('should work for IPv4 addresses', () => {
      expect(nameToSubjectAltName('127.0.0.1')).toEqual({
        type: 7,
        value: '\x7F\x00\x00\x01',
      });
    });

    it('should work for IPv6 addresses', () => {
      expect(nameToSubjectAltName('[2001:abcd::ef01]')).toEqual({
        type: 7,
        value: ' \x01«Í\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00ï\x01',
      });
    });

    it('should not use type IP for invalid IP addresses', () => {
      expect(nameToSubjectAltName('127.0.0.1.2')).toEqual({
        type: 2,
        value: '127.0.0.1.2',
      });
      expect(nameToSubjectAltName('127.0.0.1234')).toEqual({
        type: 2,
        value: '127.0.0.1234',
      });
      expect(nameToSubjectAltName('[2001:abcde::ef01]')).toEqual({
        type: 2,
        value: '[2001:abcde::ef01]',
      });
    });
  });
});
