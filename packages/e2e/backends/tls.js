////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

const CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAI87e2FcduBdMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTgxMjEzMTYxOTE3WhcNMTkwMTEyMTYxOTE3WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAtrQRseQymmVkS32Tq3WzYkN8GbSpqf91RGEWEMmjcEu7MbO4SEXFxguf
F19EabCdDRs9WdHGZNpQCcKF5Zp+cVkBfUpL0qq2qUrI/MdfzKgkcBJZCXmxYhnW
nHlZjssMprQjj4BOe+1cDNRcjr2L9WizIEyizddU+wccnLnHF7tf0wTXTT2PTU42
xr7++ygwcX+64+GSMgJX2npKM40vJoERqXw8rVwHLit7IZ34eB2LJdz9CQPPh2h7
2tx2RborIEP3ABZDsvuuZRXKZUm95iE4hSGKpqzMG/Hl4gpztqSsY2KWvzoBiKSC
hUFv1RFAmQDfinDxWrN/pxyjTVZAVQIDAQABo1AwTjAdBgNVHQ4EFgQUfj79vAHY
uLCiVvrW5DjEVjrZ33QwHwYDVR0jBBgwFoAUfj79vAHYuLCiVvrW5DjEVjrZ33Qw
DAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAZF47YpnWqX08EWxFGozk
/9HKHYFizqoYa2PRE17FmLfl7xwOWHyDcSwTqUqcce9InJB1ewwdbPxsm9VQ95c0
xs4Ec/RJcAh3qIbfCMdelUcuKMvnGR8mR6k1cSDAkh2Ur288VaKcWxN+QAlsKwV0
qG8YAUHLkGo/341NspLkvQgOxh/IPjZCeh3wKRGNkIcP0GCyuQ4sM2EdNRVpz6/R
yDmC7LJxGPfzBtZtmIDrBSXe9mudrAAbUer8mheA3mSgG3PDoz4iFKX3w75NXZqU
ojui9Iy6KSq4utoy+fqXs2XDAi33FgdoFB9Y1iXdtT8bxo2YolKSc1fJTlFNQ5NS
0w==
-----END CERTIFICATE-----`;
exports.CERTIFICATE = CERTIFICATE;

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

const KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2tBGx5DKaZWRL
fZOrdbNiQ3wZtKmp/3VEYRYQyaNwS7sxs7hIRcXGC58XX0RpsJ0NGz1Z0cZk2lAJ
woXlmn5xWQF9SkvSqrapSsj8x1/MqCRwElkJebFiGdaceVmOywymtCOPgE577VwM
1FyOvYv1aLMgTKLN11T7BxycuccXu1/TBNdNPY9NTjbGvv77KDBxf7rj4ZIyAlfa
ekozjS8mgRGpfDytXAcuK3shnfh4HYsl3P0JA8+HaHva3HZFuisgQ/cAFkOy+65l
FcplSb3mITiFIYqmrMwb8eXiCnO2pKxjYpa/OgGIpIKFQW/VEUCZAN+KcPFas3+n
HKNNVkBVAgMBAAECggEBAJzwSq7bDViwtZle8kT7Iq7Kt0RBeugLBslI+DJNcnYY
p2DHNwnl3UAEZZEnBVYgHpfOiUGpP1kMamonzOpwbiKhSPU9p6n7eFItaj4waKsc
18fpCtBn1yYkecQJPRO6eVCNNmqi1UgAmOxwUl1OlnWkjRG2orZcPKQw9LPvpQRN
OsymPB4mD2ba1WpnklF2PikW4hjAqSVTNa6gVM2nYJhJzcBujc4QnIqDH0h9O7Iv
qk+trDwno1NPKHK73nxxWJNwdrGt9jXKYkCY/44ok5OxqI83ps/iOA+eOTMJHbEz
uDSHl/w1fZ2JRnOZsJKn+cFCWVQzPT9R32brLyWehyECgYEA8k32uT8AhAAJDDHe
lml0qdcbA057A+DLt18oYYKtHmg1z2ZrtAesItdQivDFEvFryf8UAgqXFGZFZUNw
2JMc8FLGjJKac8Pk3D1+DK5bgBHWSxKT/el3UmeKAtluRqdoFiqwOYQ1pI6N82HA
wnEovXu1Yhps/e0dAgR4zG5JzCkCgYEAwQe0MlzmW5MABCeBYGt//If9VqyOtL5S
5y1vcV2Dw6NNi8jRae0cwp+uFA75rtrB3lTBbEWt/n72fzA7crtVG0/6vlUbMCMJ
ai5q19pM3v/kjbzESHOpl0FDMtvaNsDXRZR6s2WewoIagaNG4yF3mLa/t1ezuhT3
VcOWnEYAGE0CgYAi7XgeNeW2IWcsedfTKLpnbRl4vYxf/7x931qry7F2y6DOF754
wg5fK1hx3skZtPFLudhBfxNOHnvsX+9ZWMN4JQZ35v4ap+dKlBaib1PDP077nV71
3/ySRViQlpUd3C3V3Ctw7wzofqAZsEKgBL3Rqo536MVDSTXAP7LGDTPYGQKBgHEj
39XJJ+gy4EaPFUD7oXfWCYKc/8Qm7ha8Rd7PriSkehZdrYkFxt64k2MEaAq6A/oZ
+YlJyjMqHbbtAVs9PCQXG+QlpBrx3lnTPSKpvHbUzBTbuLyytouGYCnWPS/slgEd
h1HRVV2yvnCP0EPe4Oes7fA7wodmNJabXpLYYMPdAoGAFP3ABUWofAvv1dkj4hiy
qXSLKFK8rv1Nx3rm4DC06oEEvLz0hzc119VHI6ExpQ4kDmaz8PYM4uytUqzs7E+r
qC6OZdqtTF1il/i37eCFHrlYLGBQXUf/WVYnZXS15ksDMEbi6sru1f1iqUU+KbUH
o6ZfXXrClFiKKo3c3b/G17Y=
-----END PRIVATE KEY-----`;
exports.KEY = KEY;
