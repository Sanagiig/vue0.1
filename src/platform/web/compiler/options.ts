import {
  isUnaryTag,
  canBeLeftOpenTag,
  isNonPhrasingTag,
  genStaticKeys,
  isPreTag,
  mustUseProp,
  isReservedTag,
  getTagNamespace
} from '@utils/index';

import modules from './modules/index';
import directives from './directives/index';
export const baseOptions:CompilerOptions = {
  expectHTML: true,
  modules:<any>modules,
  directives:<any>directives,
  isPreTag,
  isUnaryTag,
  mustUseProp,
  canBeLeftOpenTag,
  isReservedTag,
  getTagNamespace,
  staticKeys: genStaticKeys(<any>modules)
}