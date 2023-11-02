import { stringifyPretty } from '../json';
import * as yaml from 'yaml';

export interface FileFormat {
  stringify(content: any): Buffer;
  parse(content: Buffer): any;
}

export const jsonFormat: FileFormat = {
  stringify(content: any): Buffer {
    return Buffer.from(stringifyPretty(content), 'utf8');
  },
  parse(content: Buffer): any {
    return JSON.parse(content.toString('utf8'));
  },
};

export const yamlFormat: FileFormat = {
  stringify(content: any): Buffer {
    return Buffer.from(yaml.stringify(content, { blockQuote: 'literal' }), 'utf8');
  },
  parse(content: Buffer): any {
    return yaml.parse(content.toString('utf8'));
  },
};

const yamlRegExp = /\.ya?ml$/i;
export const detectHarFormat = (fileName: string): FileFormat =>
  yamlRegExp.test(fileName) ? yamlFormat : jsonFormat;
