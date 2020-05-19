import { toNumber,toString,looseEqual,looseIndexOf } from '@utils/index';
import {renderList} from './render-list';
import {renderSlot} from './render-slot';
import {resolveFilter} from './resolve-filter';
import { checkKeyCodes } from './check-keycodes';
import { bindObjectProps } from './bind-object-props';
import { renderStatic, markOnce } from './render-static'
import { createTextVNode,createEmptyVNode } from '@vdom/vnode';
import { resolveScopedSlots } from './resolve-slots'
import { bindObjectListeners } from './bind-object-listeners'

export function installRenderHelpers(target: Component) {
  target._o = markOnce;
  target._n = toNumber;
  target._s = toString;
  target._l = renderList;
  target._t = renderSlot;
  target._q = looseEqual;
  target._i = looseIndexOf;
  target._m = renderStatic;
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  target._v = createTextVNode;
  target._e = createEmptyVNode;
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
}