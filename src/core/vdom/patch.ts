import { isDef, isTrue, warn,isRegExp } from "@utils/index";
import VNode, { cloneVNode } from "./vnode";
import config from "@config/index";
import { isPrimitive, isUndef, isTextInputType } from '../../utils/assert';
import { activeInstance } from "../instance/lifecycle";
import { setTextContent, tagName, parentNode } from '../../utils/node-ops';
import { initProvide } from '../instance/inject';
import { makeMap } from '../../utils/convert/index';
import { traverse } from '../observer/traverse';
import { SSR_ATTR } from '../../utils/shared/constants';
import { registerRef } from "./modules/ref";

export const emptyNode: any = new VNode("", {}, []);

const hooks = ["create", "activate", "update", "remove", "destroy"];

// 通过key , tag , isComment, data, sameInputTYpe 判断是否属于同一vnode
// isAsyncPlaceholder、asyncFactory ？？
function sameVnode(a: VNodeInstance, b: VNodeInstance) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a,b)
      ) ||
      (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef((<any>b.asyncFactory).error)
      )
    )
  )
}

// 判断data.type 或 tag 是否属于 text类
function sameInputType(a: any, b: any) { 
  if (a.tag !== 'input') return true;
  let i;
  const typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
  const typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
  return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB);
}

export function createPatchFunction(backend: any) {
  let i, j
  // 生命周期狗子
  const cbs:any = {}

  const { modules, nodeOps } = backend;

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = []
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]])
      }
    }
  }
  console.log('cbs',cbs)
  // 生成空 vnode
  function emptyNodeAt (elm:Element) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  // 生成 vnode.key 与 index 的map
  function createKeyToOldIdx (children:any, beginIdx:any, endIdx:any) {
    let i, key
    const map:any = {}
    for (i = beginIdx; i <= endIdx; ++i) {
      key = children[i].key
      if (isDef(key)) map[key] = i
    }
    return map
  }

  // 建立元素引用
  function createRmCb (childElm:Element, listeners:number) {
    function remove () {
      if (--remove.listeners === 0) {
        removeNode(childElm)
      }
    }
    remove.listeners = listeners
    return remove
  }

  function removeNode (el:any) {
    const parent = nodeOps.parentNode(el)
    // element may have already been removed due to v-html / v-text
    if (isDef(parent)) {
      nodeOps.removeChild(parent, el)
    }
  }

  // 判断 !pre !vnode.ns 不属于config.ignoredElements 以及 config.isUnknownElement
  // 则将该vnode 当成 未知元素
  function isUnknownElement (vnode:VNodeInstance, inVPre:any) {
    return (
      !inVPre &&
      !vnode.ns &&
      !(
        config.ignoredElements.length &&
        (<Array<string | RegExp>>config.ignoredElements).some((ignore:RegExp | string) => {
          return isRegExp(ignore)
            ? (<RegExp>ignore).test((<string>vnode.tag))
            : ignore === vnode.tag
        })
      ) &&
      config.isUnknownElement(vnode.tag)
    )
  }

  // 创建 pre 元素计数
  // 将vnode 作为 elm 挂载到 parentElm 中， 
  // vnodes.children 的vnodes push 到 insertedVnodeQueue 
  let creatingElmInVPre = 0;
  function createElm (
    vnode:VNodeInstance,
    insertedVnodeQueue:VNodeInstance[],
    parentElm?:Element,
    refElm?:Element | null,
    nested?:Boolean,
    // children
    ownerArray?:VNodeInstance[],
    index?:any
  ) {
    // 如果vnode 被上一次渲染使用过，则用它的副本
    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // This vnode was used in a previous render!
      // now it's used as a new node, overwriting its elm would cause
      // potential patch errors down the road when it's used as an insertion
      // reference node. Instead, we clone the node on-demand before creating
      // associated DOM element for it.
      vnode = (<VNodeInstance[]>ownerArray)[index] = cloneVNode(vnode)
    }

    vnode.isRootInsert = !nested // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    const data = vnode.data
    const children = vnode.children
    const tag = vnode.tag
    // 有tag vnode处理
    if (isDef(tag)) {
      if (process.env.NODE_ENV !== 'production') {
        if (data && data.pre) {
          creatingElmInVPre++
        }
        if (isUnknownElement(vnode, creatingElmInVPre)) {
          warn(
            'Unknown custom element: <' + tag + '> - did you ' +
            'register the component correctly? For recursive components, ' +
            'make sure to provide the "name" option.',
            vnode.context
          )
        }
      }

      // 更新 vnode.elm
      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode)
      setScope(vnode)

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
        createChildren(vnode, children, insertedVnodeQueue)
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue)
        }
        insert(parentElm, vnode.elm, refElm)
      }

      // 处理完vnode 清空 v-pre标记
      if (process.env.NODE_ENV !== 'production' && data && data.pre) {
        creatingElmInVPre--
      }

      // comment
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text)
      insert(parentElm, vnode.elm, refElm)
      // text 
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    }
  }

  // insert || append elm
  function insert (parent:any, elm:any, ref:any) {
    if (isDef(parent)) {
      if (isDef(ref)) {
        if (nodeOps.parentNode(ref) === parent) {
          nodeOps.insertBefore(parent, elm, ref)
        }
      } else {
        nodeOps.appendChild(parent, elm)
      }
    }
  }

  // 检测重复 key
  // 新建elm
  // 无children 则 当成文本 append
  function createChildren (vnode:VNodeInstance, children:any, insertedVnodeQueue:any) {
    if (Array.isArray(children)) {
      if (process.env.NODE_ENV !== 'production') {
        checkDuplicateKeys(children)
      }
      for (let i = 0; i < children.length; ++i) {
        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i)
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
    }
  }

  // 执行模块 cbs.create
  // 执行 vnode create hook , 并将有 insert hook 的vnode 加入到insertedVnodeQueue
  function invokeCreateHooks (vnode:any, insertedVnodeQueue:any) {
    for (let i = 0; i < cbs.create.length; ++i) {
      cbs.create[i](emptyNode, vnode)
    }
    i = vnode.data.hook // Reuse variable
    if (isDef(i)) {
      if (isDef(i.create)) i.create(emptyNode, vnode)
      if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
    }
  }

  // 判断key 是否重复
  function checkDuplicateKeys (children:any) {
    const seenKeys:any = {}
    for (let i = 0; i < children.length; i++) {
      const vnode = children[i]
      const key = vnode.key
      if (isDef(key)) {
        if (seenKeys[key]) {
          warn(
            `Duplicate keys detected: '${key}'. This may cause an update error.`,
            vnode.context
          )
        } else {
          seenKeys[key] = true
        }
      }
    }
  }

  // set scope id attribute for scoped CSS.
  // this is implemented as a special case to avoid the overhead
  // of going through the normal attribute patching process.
  // 根据 $options._scopeId 初始化 elm 的 ${$options._scopeId} attr
  function setScope (vnode:any) {
    let i
    // 删除 tag scopeId attr
    if (isDef(i = vnode.fnScopeId)) {
      nodeOps.setStyleScope(vnode.elm, i)

      // 初始化所有父节点 以 $options._scopeId 为名对应的 attr 
    } else {
      let ancestor = vnode
      while (ancestor) {
        if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
          nodeOps.setStyleScope(vnode.elm, i)
        }
        ancestor = ancestor.parent
      }
    }
    // for slot content they should also get the scopeId from the host instance.
    // 当前 instance 与 vnode 上下文不一致 并且
    if (isDef(i = activeInstance) &&
      i !== vnode.context &&
      i !== vnode.fnContext &&
      isDef(i = i.$options._scopeId)
    ) {
      nodeOps.setStyleScope(vnode.elm, i)
    }
  }

  function createComponent (vnode:VNodeInstance, insertedVnodeQueue:any, parentElm:any, refElm:any) {
    let i:any = (<VNodeData>vnode.data)
    if (isDef(i)) {
      const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */)
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue)
        insert(parentElm, vnode.elm, refElm)
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
        }
        return true
      }
    }
  }

  function initComponent (vnode:any, insertedVnodeQueue:any) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
      vnode.data.pendingInsert = null
    }
    vnode.elm = vnode.componentInstance.$el
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue)
      setScope(vnode)
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode)
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode)
    }
  }

  // 查找vnode.componentInstance 判断最外层vnode 是否定义了tag
  function isPatchable (vnode:any) {
    while (vnode.componentInstance) {
      vnode = vnode.componentInstance.VNode
    }
    return isDef(vnode.tag)
  }

  function reactivateComponent (vnode:VNodeInstance, insertedVnodeQueue:any, parentElm:any, refElm:any) {
    let i
    // hack for #4339: a reactivated component with inner transition
    // does not trigger because the inner node's created hooks are not called
    // again. It's not ideal to involve module-specific logic in here but
    // there doesn't seem to be a better way to do it.
    let innerNode:any = vnode
    while (innerNode.componentInstance) {
      innerNode = innerNode.componentInstance.VNode
      if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
        for (i = 0; i < cbs.activate.length; ++i) {
          cbs.activate[i](emptyNode, innerNode)
        }
        insertedVnodeQueue.push(innerNode)
        break
      }
    }
    // unlike a newly created component,
    // a reactivated keep-alive component doesn't insert itself
    insert(parentElm, vnode.elm, refElm)
  }

  // 根据 index 批量创建ele
  function addVnodes (
    parentElm:Element,
    refElm:Element | null, 
    vnodes:VNodeInstance[], 
    startIdx:number,
    endIdx:number, 
    insertedVnodeQueue:VNodeInstance[]) {
    for (; startIdx <= endIdx; ++startIdx) {
      createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx)
    }
  }

  // vnode and children => destroy hook , cbs.destroy
  // 从上至下 销毁 vnode
  function invokeDestroyHook (vnode:any) {
    let i, j
    const data = vnode.data
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) i(vnode)
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode)
    }
    if (isDef(i = vnode.children)) {
      for (j = 0; j < vnode.children.length; ++j) {
        invokeDestroyHook(vnode.children[j])
      }
    }
  }

  // 删除多个vnode
  function removeVnodes (parentElm:Element, vnodes:VNodeInstance[], startIdx:number, endIdx:number) {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx]
      if (isDef(ch)) {
        if (isDef(ch.tag)) {
          removeAndInvokeRemoveHook(ch)
          invokeDestroyHook(ch)
        } else { // Text node
          removeNode(ch.elm)
        }
      }
    }
  }

  // 修改RmCb listenrs , 并调用cbs.remove[i](vnode,rm)
  // 调用 remmove hook
  // 如果vnode.data 则处理器监听者，按照modules 的数量进行清除
  // 如果 组件vnode 则会递归调用
  function removeAndInvokeRemoveHook (vnode:any, rm?:any) {
    if (isDef(rm) || isDef(vnode.data)) {
      let i
      const listeners = cbs.remove.length + 1

      // 修改 rm 的 监听数
      if (isDef(rm)) {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners
      } else {
        // directly removing
        rm = createRmCb(vnode.elm, listeners)
      }

      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i.VNode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm)
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm)
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm)
      } else {
        rm()
      }
    } else {
      removeNode(vnode.elm)
    }
  }

  function updateChildren (
    parentElm:any, 
    oldCh:any, 
    newCh:any, 
    insertedVnodeQueue:any, 
    removeOnly:any) {
    let oldStartIdx = 0
    let newStartIdx = 0
    let oldEndIdx = oldCh.length - 1
    let oldStartVnode = oldCh[0]
    let oldEndVnode = oldCh[oldEndIdx]
    let newEndIdx = newCh.length - 1
    let newStartVnode = newCh[0]
    let newEndVnode = newCh[newEndIdx]
    let oldKeyToIdx, idxInOld, vnodeToMove, refElm

    // removeOnly is a special flag used only by <transition-group>
    // to ensure removed elements stay in correct relative positions
    // during leaving transitions
    const canMove = !removeOnly

    if (process.env.NODE_ENV !== 'production') {
      checkDuplicateKeys(newCh)
    }

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      // 忽略未定义的 oldVnode
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx]

        // 如果新旧start节点属于同一vnode 则 patch
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
        oldStartVnode = oldCh[++oldStartIdx]
        newStartVnode = newCh[++newStartIdx]

        // 如果新旧end节点属于同一vnode 则 patch
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
        oldEndVnode = oldCh[--oldEndIdx]
        newEndVnode = newCh[--newEndIdx]

        // 如果新end 旧start 节点属于同一vnode 则 patch 
        // 并将 oldStart.elm 插入 oldEndVnode.elm 后一个
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
        canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
        oldStartVnode = oldCh[++oldStartIdx]
        newEndVnode = newCh[--newEndIdx]

        // 如果新start 旧end 节点属于同一vnode 则 patch 
        // 并将 oldEnd.elm 插入 oldStart.elm 前一个
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
        canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
        oldEndVnode = oldCh[--oldEndIdx]
        newStartVnode = newCh[++newStartIdx]

        // 新旧 start end 4个节点均不匹配
      } else {
        // 根据 key:index 找 newVnode.key 在 old 的索引
        // 如果没有 key 则 在现有的 oldVnodes 中寻找 sameVnode 的索引
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
        idxInOld = isDef(newStartVnode.key)
          ? oldKeyToIdx[newStartVnode.key]
          : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
        
        // 没有在old 找到对应的 下标则新建elm , 将新elm 插入到 oldStart.elm 前
        if (isUndef(idxInOld)) { // New element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)

        } else {
          vnodeToMove = oldCh[idxInOld]
          // 通过下标找到 old 对应的vnode 则 patch , 并将原有的old[idx] 置空
          // 将 vnodeToMove.elm 插入至 oldStart 前
          if (sameVnode(vnodeToMove, newStartVnode)) {
            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx)
            oldCh[idxInOld] = undefined
            canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)

            // 找出的 index 与新节点不匹配则新建
          } else {
            // same key but different element. treat as new element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx)
          }
        }
        newStartVnode = newCh[++newStartIdx]
      }
    }

    // 新vnodes 已完全在 old 中找到
    // 则将新增的vnodes 以 newEnd + 1 的elm 作为基准 插入到 parentElm 中
    if (oldStartIdx > oldEndIdx) {
      refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
      addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue)
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
  }

  // 在oldVnodes 中寻找与node 属于同样vnode 的节点，并返回索引 
  function findIdxInOld (node:any, oldCh:any, start:any, end:any) {
    for (let i = start; i < end; i++) {
      const c = oldCh[i]
      if (isDef(c) && sameVnode(node, c)) return i
    }
  }

  // 对比vnode 的差异，并对静态节点复用
  // 如果是组件占位符则 hydrate
  // 如果是静态组件则直接复用 old.componentInstance
  // 触发cbs prepatch 、 update 、 postpatch
  // updateChildren
  function patchVnode (
    oldVnode:any,
    vnode:any,
    insertedVnodeQueue:any,
    ownerArray:any,
    index:any,
    removeOnly?:any
  ) {
    if (oldVnode === vnode) {
      return
    }

    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // clone reused vnode
      vnode = ownerArray[index] = cloneVNode(vnode)
    }

    const elm = vnode.elm = oldVnode.elm

    // 处理组件占位符
    if (isTrue(oldVnode.isAsyncPlaceholder)) {
      if (isDef(vnode.asyncFactory.resolved)) {
        hydrate(oldVnode.elm, vnode, insertedVnodeQueue)
      } else {
        vnode.isAsyncPlaceholder = true
      }
      return
    }

    // reuse element for static trees.
    // note we only do this if the vnode is cloned -
    // if the new node is not cloned it means the render functions have been
    // reset by the hot-reload-api and we need to do a proper re-render.
    if (isTrue(vnode.isStatic) &&
      isTrue(oldVnode.isStatic) &&
      vnode.key === oldVnode.key &&
      (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ) {
      vnode.componentInstance = oldVnode.componentInstance
      return
    }

    let i
    const data = vnode.data
    if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
      i(oldVnode, vnode)
    }

    // cbs.update && update hook
    const oldCh = oldVnode.children
    const ch = vnode.children
    if (isDef(data) && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
      if (isDef(i = data.hook) && isDef(i = i.update)) i(oldVnode, vnode)
    }

    // 处理无文本vnode
    if (isUndef(vnode.text)) {
      // 新旧子节点皆存在则更新子节点
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
      
      // 只有新子节点则新建vnodes && elms
      } else if (isDef(ch)) {
        if (process.env.NODE_ENV !== 'production') {
          checkDuplicateKeys(ch)
        }
        // 新增子节点
        if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)

        // 无新子节点则清除子节点 && elm.children
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1)

        // 如果只有文本，无新节点 则清除文本子节点 
      } else if (isDef(oldVnode.text)) {
        nodeOps.setTextContent(elm, '')
      }

      // 更新文本节点
    } else if (oldVnode.text !== vnode.text) {
      nodeOps.setTextContent(elm, vnode.text)
    }

    // cbs.postpatch
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.postpatch)) i(oldVnode, vnode)
    }
  }

  // 为初始化的插入的 queue 父data打标记 pendingInsert= queue
  // 或触发 vnode insert hook
  function invokeInsertHook (vnode:any, queue:VNodeInstance[], initial:boolean) {
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (isTrue(initial) && isDef(vnode.parent)) {
      vnode.parent.data.pendingInsert = queue
    } else {
      for (let i = 0; i < queue.length; ++i) {
        (<any>queue[i].data).hook.insert(queue[i])
      }
    }
  }

  let hydrationBailed = false
  // list of modules that can skip create hook during hydration because they
  // are already rendered on the client or has no need for initialization
  // Note: style is excluded because it relies on initial clone for future
  // deep updates (#7063).
  const isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key')

  // Note: this is a browser-only function so we can assume elms are DOM nodes.
  // 为vnode 指定 elm
  // 处理vnode.isAsyncPlaceholder 状态
  // 为空 elm 新增 children
  // 将 vnode.text 更新到 elm.data
  // 返回 vnode 与 elm 子节点长度对比的状态
  function hydrate (elm:any, vnode:any, insertedVnodeQueue:any, inVPre?:any) {
    let i
    const { tag, data, children } = vnode
    inVPre = inVPre || (data && data.pre)
    vnode.elm = elm

    // 对comment占位节点不做过多处理
    if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
      vnode.isAsyncPlaceholder = true
      return true
    }

    // assert node match
    // 判断是否合法elm
    if (process.env.NODE_ENV !== 'production') {
      if (!assertNodeMatch(elm, vnode, inVPre)) {
        return false
      }
    }

    if (isDef(data)) {
      // 执行 init hook
      if (isDef(i = data.hook) && isDef(i = i.init)) i(vnode, true /* hydrating */)
      // 如果是组件则初始化它
      if (isDef(i = vnode.componentInstance)) {
        // child component. it should have hydrated its own tree.
        initComponent(vnode, insertedVnodeQueue)
        return true
      }
    }

    // 标准tag 处理
    if (isDef(tag)) {
      // 处理拥有 children vnode
      if (isDef(children)) {
        // empty element, allow client to pick up and populate children
        // vnode children 与 单elm 则生成 elm.children 
        if (!elm.hasChildNodes()) {
          createChildren(vnode, children, insertedVnodeQueue)
        } else {
          // v-html and domProps: innerHTML
          // 处理 innerHTML 与 vnode 不一致情况（报错并中断）
          if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
            if (i !== elm.innerHTML) {
              /* istanbul ignore if */
              if (process.env.NODE_ENV !== 'production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true
                console.warn('Parent: ', elm)
                console.warn('server innerHTML: ', i)
                console.warn('client innerHTML: ', elm.innerHTML)
              }
              return false
            }
          } else {
            // iterate and compare children lists
            // 逐个取出elm.children ， 与 vnode.children 进行 hydrate
            // childrenMatch 记录状态，异常则中断循环
            let childrenMatch = true
            let childNode = elm.firstChild
            for (let i = 0; i < children.length; i++) {
              if (!childNode || !hydrate(childNode, children[i], insertedVnodeQueue, inVPre)) {
                childrenMatch = false
                break
              }
              childNode = childNode.nextSibling
            }
            // if childNode is not null, it means the actual childNodes list is
            // longer than the virtual children list.
            //  elm children 比 vnode 多 或出现异常
            if (!childrenMatch || childNode) {
              /* istanbul ignore if */
              if (process.env.NODE_ENV !== 'production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true
                console.warn('Parent: ', elm)
                console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children)
              }
              return false
            }
          }
        }
      }

      if (isDef(data)) {
        let fullInvoke = false
        // 判断vnode.data 中是否有 除renderedModule 中的key
        // 执行vnode 的 create hook...
        for (const key in data) {
          if (!isRenderedModule(key)) {
            fullInvoke = true
            invokeCreateHooks(vnode, insertedVnodeQueue)
            break
          }
        }
        // 如果该节点没有被出发hook 则对 class 触发其依赖收集
        if (!fullInvoke && data['class']) {
          // ensure collecting deps for deep class bindings for future updates
          traverse(data['class'])
        }
      }
      // 将vnode.txt 更新到elm.data
    } else if (elm.data !== vnode.text) {
      elm.data = vnode.text
    }
    return true
  }

  // vnode 属于组件 或有正常 tag
  // node 是text 或 comment
  // 则通过断言
  function assertNodeMatch (node:any, vnode:any, inVPre?:any) {
    if (isDef(vnode.tag)) {
      return vnode.tag.indexOf('vue-component') === 0 || (
        !isUnknownElement(vnode, inVPre) &&
        vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
      )
    } else {
      return node.nodeType === (vnode.isComment ? 8 : 3)
    }
  }

  return function patch (
    oldVnode:any, 
    vnode:any, 
    hydrating:any, 
    removeOnly?:any) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }

    let isInitialPatch = false
    const insertedVnodeQueue: any = []
    
    // old 为空则新建 ele   
    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true
      createElm(vnode, insertedVnodeQueue)
    } else {
      const isRealElement = isDef(oldVnode.nodeType)
      
      // old new 属于同类型
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
      } else {
        // old 属于ele(第一次挂载) 创建新的 elm
        if (isRealElement) {
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          // SSR
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR)
            hydrating = true
          }
          if (isTrue(hydrating)) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true)
              return oldVnode
            } else if (process.env.NODE_ENV !== 'production') {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              )
            }
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode)
        }

        // replacing existing element
        const oldElm = oldVnode.elm
        const parentElm = nodeOps.parentNode(oldElm)

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        )

        // update parent placeholder node element, recursively
        if (isDef(vnode.parent)) {
          let ancestor = vnode.parent
          const patchable = isPatchable(vnode)
          while (ancestor) {
            // 触发 vnode 所有父节点 cbs.destroy
            for (let i = 0; i < cbs.destroy.length; ++i) {
              cbs.destroy[i](ancestor)
            }
            
            // 如果当前vnode 最外层父节点有tag ，则cbs.create
            // 将所有父节点 elm 更新为当前vnode.elm
            ancestor.elm = vnode.elm
            if (patchable) {
              for (let i = 0; i < cbs.create.length; ++i) {
                cbs.create[i](emptyNode, ancestor)
              }
              // #6513
              // invoke insert hooks that may have been merged by create hooks.
              // e.g. for directives that uses the "inserted" hook.
              // 触发创建过的挂载指令的 inserted hook
              const insert = ancestor.data.hook.insert
              if (insert.merged) {
                // start at index 1 to avoid re-invoking component mounted hook
                for (let i = 1; i < insert.fns.length; i++) {
                  insert.fns[i]()
                }
              }
            } else {
              registerRef(ancestor)
            }
            ancestor = ancestor.parent
          }
        }

        // destroy old node
        if (isDef(parentElm)) {
          removeVnodes(parentElm, [oldVnode], 0, 0)
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode)
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
  }
};
