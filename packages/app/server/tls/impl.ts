import { Socket } from 'net';
import { promises } from 'fs';
import { resolve } from 'path';
import { pem, pki, asn1 } from 'node-forge';
import { createSecureContext, SecureContext, TLSSocket } from 'tls';
import { createCertificate } from './certs';
import { forwardSocketConnections, getSocketConnection } from '../connection';

export class TLSManager {
  private _caObject: pki.Certificate;
  private _caPem: string;
  private _contexts = new Map<string, Promise<SecureContext>>();

  constructor(
    private _config: {
      root: string;
      tlsCAKeyPath: string | null;
      tlsKeySize: number;
    },
  ) {}

  public async init() {
    const { root, tlsCAKeyPath } = this._config;
    const tlsCAFilePath = tlsCAKeyPath ? resolve(root, tlsCAKeyPath) : null;
    if (tlsCAFilePath) {
      try {
        let ca: pki.Certificate | undefined;
        let key: pki.PrivateKey | undefined;
        let extraItems = 0;
        const content = await promises.readFile(tlsCAFilePath, 'utf8');
        for (const object of pem.decode(content)) {
          const isCertificate =
            object.type === 'CERTIFICATE' ||
            object.type === 'X509 CERTIFICATE' ||
            object.type === 'TRUSTED CERTIFICATE';
          const isPrivateKey = object.type === 'PRIVATE KEY' || object.type === 'RSA PRIVATE KEY';
          const body = asn1.fromDer(object.body);
          if (isCertificate && !ca) {
            ca = pki.certificateFromAsn1(body);
          } else if (isPrivateKey && !key) {
            key = pki.privateKeyFromAsn1(body);
          } else {
            extraItems++;
          }
        }
        if (!ca || !key || extraItems > 0) {
          throw new Error(
            `${tlsCAKeyPath} should contain exactly one certificate and one private key.`,
          );
        }
        ca.privateKey = key;
        this._caObject = ca;
        this._caPem = pki.certificateToPem(ca);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
    if (!this._caObject) {
      const ca = await createCertificate(['DO NOT TRUST kassette TLS interception certificate'], {
        keySize: this._config.tlsKeySize,
        ca: true,
      });
      this._caObject = ca.object;
      this._caPem = ca.cert;
      if (tlsCAFilePath) {
        await promises.writeFile(tlsCAFilePath, `${ca.cert}\n${ca.key}`);
      }
    }
  }

  private async _getSecureContext(host: string) {
    let res = this._contexts.get(host);
    if (!res) {
      res = (async () => {
        const certificate = await createCertificate([host], {
          issuer: this._caObject,
          keySize: this._config.tlsKeySize,
        });
        return createSecureContext({
          cert: `${certificate.cert}\n${this._caPem}`,
          key: certificate.key,
        });
      })();
      this._contexts.set(host, res);
    }
    return res;
  }

  public async process(
    socket: Socket,
    ALPNProtocols: string[],
    hostname = getSocketConnection(socket).hostname,
  ): Promise<Socket> {
    const secureContext = await this._getSecureContext(hostname);
    const SNICallback = async (
      sni: string,
      callback: (error: Error | null, context: SecureContext) => void,
    ) => {
      const sniContext = sni === hostname ? secureContext : await this._getSecureContext(sni);
      callback(null, sniContext);
    };
    const tlsSocket = new TLSSocket(socket, {
      isServer: true,
      ALPNProtocols,
      SNICallback,
      secureContext,
    });
    forwardSocketConnections(socket, tlsSocket);
    return tlsSocket;
  }
}
