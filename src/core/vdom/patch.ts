import { 
  isDef,
  isTrue,
  createComponent,
  warn
 } from '@utils/index';
import VNode, { cloneVNode } from './vnode';
import config from '@config/index';
import { isRegExp } from 'util';
import {  } from '@utils/index';

export const emptyNode:any = new VNode('', {}, []);

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

    function removeNode(el:Element){
      const parent = nodeOps.parentNode(el);
      // element may have already been removed due to v-html / v-text
      if(isDef(parent)){
        nodeOps.removeChild(parent,el);
      }
    }

    function isUnknownElement(vnode:VNodeInstance,inVPre:boolean | number):boolean{
      return (
        !inVPre 
        && vnode.ns
        && !(
          config.ignoredElements.length 
          && config.ignoredElements.some(ignore =>{
            return isRegExp(ignore)
              ? ignore.test(<string>vnode.tag)
              : ignore === vnode.tag;
          })
        )
        && config.isUnknownElement(vnode.tag)
      )
    }

    let creatingElmInVPre = 0;

    function createElm(
      vnode:VNodeInstance,
      insertedVnodeQueue:any[],
      parentElm?:Element,
      refElm?:Element,
      nested?:Element,
      ownerArray?:any,
      index?:number
    ){
      if(isDef(vnode.elm) && isDef(ownerArray)){
        // This vnode was used in a previous render!
        // now it's used as a new node, overwriting its elm would cause
        // potential patch errors down the road when it's used as an insertion
        // reference node. Instead, we clone the node on-demand before creating
        // associated DOM element for it.
        vnode = ownerArray[<number>index] = cloneVNode(vnode);
      }
      
      // for transition enter check
      vnode.isRootInsert = !nested;
      if(createComponent(vnode,insertedVnodeQueue,<any>parentElm,<any>refElm)){
        return ;
      }

      const data = vnode.data;
      const children = vnode.children;
      const tag = vnode.tag;
      if(isDef(tag)){
        if(process.env.NODE_ENV !== 'production'){
          if(data && data.pre){
            creatingElmInVPre ++;
          }

          if(isUnknownElement(vnode,creatingElmInVPre)){
            warn(
              'Unknown custom element: <' + tag + '> - did you ' +
              'register the component correctly? For recursive components, ' +
              'make sure to provide the "name" option.',
              vnode.context
            )
          }
        }

        vnode.elm = vnode.ns
          ? nodeOps.createElementNS(vnode.ns,tag)
          : nodeOps.createElement(tag,vnode);
        setScope(vnode);

        /* istanbul ignore if */
        // if (__WEEX__) {
        if (false) {
          // in Weex, the default insertion order is parent-first.
          // List items can be optimized to use children-first insertion
          // with append="tree".
          const appendAsTree = isDef(data) && isTrue((<any>data).appendAsTree)
          if (!appendAsTree) {
            if (isDef(data)) {
              invokeCreateHooks(vnode, insertedVnodeQueue)
            }
            insert(parentElm, vnode.elm, refElm)
          }
          createChildren(vnode, children, insertedVnodeQueue)
          if (appendAsTree) {
            if (isDef(data)) {
              invokeCreateHooks(vnode, insertedVnodeQueue)
            }
            insert(parentElm, vnode.elm, refElm)
          }
        } else {
          createChildren(vnode,children,insertedVnodeQueue);
          if(isDef(data)){
            invokeCreateHooks(vnode,insertedVnodeQueue);
          }
          insert(parentElm,vnode.elm,refElm);
        }
      }
    }

    function invokeCreateHooks (vnode:any, insertedVnodeQueue:any) {
      for(let i=0;i<cbs.create.length;i++){
        cbs.create[i](emptyNode,vnode);
      }
      // Reuse variable
      i = vnode.data.hook;
      if(isDef(i)){
        if(isDef(i.create)) 
      }
    }
    
    function insert (parent:any, elm:any, ref:any) {}

    function createChildren (vnode:VNodeInstance, children:any, insertedVnodeQueue:any) {}

    // set scope id attribute for scoped CSS.
    // this is implemented as a special case to avoid the overhead
    // of going through the normal attribute patching process.
    function setScope (vnode:any) {}
  }
}
