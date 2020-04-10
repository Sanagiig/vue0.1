import { isDef } from '../../utils/assert';
import VNode from './vnode';

const hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

export function createPatchFunction(backend: any) {
  return function patch(
    oldVnode: any,
    vnode: any,
    hydrating: any,
    removeOnly?: any) {
    let i, j;
    // 
    const cbs:any = {};
    const { modules, nodeOps } = backend;

    for (i = 0; i < hooks.length; i++){
      cbs[hooks[i]] = [];
      for (j = 0; j < modules.length; j++){
        if (isDef(modules[j][hooks[i]])) {
          cbs[hooks[i]].push(modules[j][hooks[i]]);
        }
      }
    }

    function emptyNodeAt(elm: Element) {
      return new VNode(
        nodeOps.tagName(elm).toLowerCase(),
        <VNodeData>{},
        []);
    }

    function createRmCb(childElm: Element, listeners: number) {
      function remove() {
        if (--remove.listeners === 0) {
          removeNode(childElm);
        }
      }
      remove.listeners = listeners;
      return remove;
    }
  }
}
