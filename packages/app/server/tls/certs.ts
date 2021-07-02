import { pki, md } from 'node-forge';

const TEN_YEARS_IN_MS = 10 * 365 * 24 * 60 * 60 * 1000;

export async function createCertificate(hostNames: string[], issuer?: pki.Certificate, ca = true) {
  const keyPair = await pki.rsa.generateKeyPair(1024);
  const cert = pki.createCertificate();
  const now = Date.now();
  cert.serialNumber = `${now}`;
  cert.validity.notBefore = new Date(now);
  cert.validity.notAfter = issuer ? issuer.validity.notAfter : new Date(now + TEN_YEARS_IN_MS);
  const subject = [
    {
      name: 'commonName',
      value: hostNames[0],
    },
  ];
  cert.setSubject(subject);
  cert.setIssuer(issuer ? issuer.subject.attributes : subject);
  cert.publicKey = keyPair.publicKey;
  cert.privateKey = keyPair.privateKey;
  cert.setExtensions([
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
    {
      name: 'subjectAltName',
      altNames: hostNames.map((name) => ({
        type: 2, // DNS name
        value: name,
      })),
    },
  ]);
  cert.sign(issuer ? issuer.privateKey : keyPair.privateKey, md.sha256.create());
  return {
    object: cert,
    key: pki.privateKeyToPem(keyPair.privateKey),
    cert: pki.certificateToPem(cert),
  };
}
