import { warn } from './debug';
import { unicodeLetters } from './parser';
import { makeMap } from './convert/index';
import { isBuiltInTag } from './assert';
import config from '@config/index';

export function validateComponentName(name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeLetters}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}