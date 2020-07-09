import { createElement } from './create-element'
import VNode,{ cloneVNode } from '@core/vdom/vnode';
import { resolveInject } from '@core/instance/inject';
import { normalizeChildren } from './normalize-children';
import { resolveSlots } from './resolve-slots';
import { normalizeScopedSlots } from './slot';
import { installRenderHelpers } from '../render/index';

import {
  isDef,
  isTrue,
  hasOwn,
  camelize,
  emptyObject,
  validateProp
} from '@utils/index';

export class FunctionalRenderContext  {
  data:any;
  props:any;
  children:any;
  parent:any;
  listeners:any;
  injections:any;
  slots:any;
  $options:any;
  $slots:any;
  $scopedSlots:any;
  _c:any;

  constructor(
  data: VNodeData,
  props: any,
  children: Array<VNodeInstance> | undefined,
  parent: Component,
  Ctor: ComponentCtor
  ) {
    const options = Ctor.options
    // ensure the createElement function in functional components
    // gets a unique context - this is necessary for correct named slot check
    let contextVm:any
    if (hasOwn(parent, '_uid')) {
      contextVm = Object.create(parent)
      // $flow-disable-line
      contextVm._original = parent
    } else {
      // the context vm passed in is a functional context as well.
      // in this case we want to make sure we are able to get a hold to the
      // real context instance.
      contextVm = parent
      // $flow-disable-line
      parent = parent._original
    }
    const isCompiled = isTrue(options._compiled)
    const needNormalization = !isCompiled

    this.data = data
    this.props = props
    this.children = children
    this.parent = parent
    this.listeners = data.on || emptyObject
    this.injections = resolveInject(options.inject, parent)
    this.slots = () => resolveSlots(<VNodeInstance[]>children, parent)

    Object.defineProperty(this, 'scopedSlots', ({
      enumerable: true,
      get () {
        return normalizeScopedSlots(data.scopedSlots, this.slots())
      }
    }))

    // support for compiled functional template
    if (isCompiled) {
      // exposing $options for renderStatic()
      this.$options = options
      // pre-resolve slots for renderSlot()
      this.$slots = this.slots()
      this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots)
    }

    if (options._scopeId) {
      this._c = (a:any, b:any, c:any, d:any) => {
        const vnode = createElement(contextVm, a, b, c, d, needNormalization)
        if (vnode && !Array.isArray(vnode)) {
          vnode.fnScopeId = options._scopeId
          vnode.fnContext = parent
        }
        return vnode
      }
    } else {
      this._c = (a:any, b:any, c:any, d:any) => createElement(contextVm, a, b, c, d, needNormalization)
    }
  }
}

// export class FunctionalRenderContextCls{
//   constructor(this:FunctionalRenderContext){
//     const args:any[] = Array(arguments).slice();
//     FunctionalRenderContext.apply(this,[...args]);
//   }
// }

installRenderHelpers(<any>FunctionalRenderContext.prototype)

export function createFunctionalComponent (
  Ctor: ComponentCtor,
  propsData: any | null,
  data: VNodeData,
  contextVm: Component,
  children: Array<VNodeInstance>  |undefined
): VNodeInstance | Array<VNodeInstance> | void {
  const options = Ctor.options
  const props:any = {}
  const propOptions = options.props
  if (isDef(propOptions)) {
    for (const key in propOptions) {
      props[key] = validateProp(key, propOptions, propsData || emptyObject)
    }
  } else {
    if (isDef(data.attrs)) mergeProps(props, data.attrs)
    if (isDef(data.props)) mergeProps(props, data.props)
  }

  const renderContext:any = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  )

  const vnode = options.render.call(null, renderContext._c, renderContext)

  if (vnode instanceof VNode) {
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
  } else if (Array.isArray(vnode)) {
    const vnodes = normalizeChildren(vnode) || []
    const res = new Array(vnodes.length)
    for (let i = 0; i < vnodes.length; i++) {
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext)
    }
    return res
  }
}

function cloneAndMarkFunctionalResult (vnode:any, data:any, contextVm:any, options:any, renderContext:any) {
  // #7817 clone node before setting fnContext, otherwise if the node is reused
  // (e.g. it was from a cached normal slot) the fnContext causes named slots
  // that should not be matched to match.
  const clone = cloneVNode(vnode)
  clone.fnContext = contextVm
  clone.fnOptions = options
  if (process.env.NODE_ENV !== 'production') {
    (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext
  }
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot
  }
  return clone
}

function mergeProps (to:any, from:any) {
  for (const key in from) {
    to[camelize(key)] = from[key]
  }
}
