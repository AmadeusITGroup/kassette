import { sanitize } from './array';

export function sanitizePath(value: any) {
  const cleaned = sanitize(value);

  const leading = cleaned[0] === '';
  const trailing = cleaned[cleaned.length - 1] === '';

  const final = cleaned.filter((part: string) => part.length > 0);

  if (leading) {
    final.unshift('');
  }
  if (trailing) {
    final.push('');
  }

  return final;
}

export function joinPath(value: any) {
  return sanitizePath(value).join('/');
}
