import { pki, md, util } from 'node-forge';

// Validity max duration in ms:
// Apple requires 825 days or fewer (cf https://support.apple.com/en-us/103769)
const VALIDITY_DURATION = 825 * 24 * 60 * 60 * 1000;

interface CertificateOptions {
  issuer?: pki.Certificate;
  ca?: boolean;
  keySize: number;
}

const ipV6RegExp = /^\[[0-9a-f:]+\]$/i;
const ipV4RegExp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const { bytesFromIPv4, bytesFromIPv6, bytesToIPv4, bytesToIPv6 } = util as any;

export const nameToSubjectAltName = (name: string) => {
  let type = 2; // DNS name
  let value = name;
  if (ipV4RegExp.test(name)) {
    const bytes = bytesFromIPv4(name);
    if (bytes && bytesToIPv4(bytes)) {
      type = 7; // IP address
      value = bytes;
    }
  } else if (ipV6RegExp.test(name)) {
    const bytes = bytesFromIPv6(name.substring(1, name.length - 1));
    if (bytes && bytesToIPv6(bytes)) {
      type = 7; // IP address
      value = bytes;
    }
  }
  return { type, value };
};

export async function createCertificate(
  hostNames: string[],
  { issuer, ca, keySize }: CertificateOptions,
) {
  const keyPair = await pki.rsa.generateKeyPair(keySize);
  const cert = pki.createCertificate();
  const now = Date.now();
  cert.serialNumber = `${now}`;
  cert.validity.notBefore = new Date(now);
  cert.validity.notAfter = new Date(
    Math.min(issuer?.validity.notAfter.getTime() ?? Infinity, now + VALIDITY_DURATION),
  );
  const subject = [
    {
      name: 'commonName',
      value: hostNames[0].replace(/[\[\]]/g, ''),
    },
  ];
  cert.setSubject(subject);
  cert.setIssuer(issuer ? issuer.subject.attributes : subject);
  cert.publicKey = keyPair.publicKey;
  cert.privateKey = keyPair.privateKey;
  const extensions: any[] = [
    {
      name: 'basicConstraints',
      cA: ca,
    },
    {
      name: 'keyUsage',
      keyCertSign: ca,
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: false,
      dataEncipherment: false,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: false,
      codeSigning: false,
      emailProtection: false,
      timeStamping: false,
    },
    {
      name: 'nsCertType',
      client: false,
      server: true,
      email: false,
      objsign: false,
      sslCA: ca,
      emailCA: false,
      objCA: false,
    },
  ];
  if (!ca) {
    extensions.push({
      name: 'subjectAltName',
      altNames: hostNames.map(nameToSubjectAltName),
    });
  }
  cert.setExtensions(extensions);
  cert.sign(issuer ? issuer.privateKey : keyPair.privateKey, md.sha256.create());
  return {
    object: cert,
    key: pki.privateKeyToPem(keyPair.privateKey),
    cert: pki.certificateToPem(cert),
  };
}
