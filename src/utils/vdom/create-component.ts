import { queueActivatedComponent } from '@core/observer/scheduler'
import { resolveConstructorOptions } from '../../core/instance/init';
import VNode from '@core/vdom/vnode';
import { createFunctionalComponent } from './create-functional-component';
import { resolveAsyncComponent, createAsyncPlaceholder } from './helpers/resolve-async-component';
import {
  warn,
  isDef,
  isUndef,
  isTrue,
  isObject
} from '@utils/index';

import { extractPropsFromVNodeData } from './helpers/extract-props';

import {
  callHook,
  activeInstance,
  updateChildComponent,
  activateChildComponent,
  deactivateChildComponent
} from '@core/instance/lifecycle'

// import {
//   isRecyclableComponent,
//   renderRecyclableComponentTemplate
// } from 'weex/runtime/recycle-list/render-component-template'

// inline hooks to be invoked on component VNodes during patch
// 组件 vnode 的狗子
const componentVNodeHooks: any = {
  /**
   * 创建组件实例, 并进行挂载
   * keep-alive 下的组件则进行 prepatch
   */
  init(vnode: VNodeWithData, hydrating: boolean): boolean | void {
    // 非首次 init 的 keep-alive 只进行 prePatch 
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },

  /**
   * 使用 vnode 的组件选项作为 options
   * 使用 oldVnode 的组件实例作为 vm 更新子组件
   */
  prepatch (oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    const options = vnode.componentOptions
    const child = vnode.componentInstance = oldVnode.componentInstance
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    )
  },

  /**
   * vm._isMounted 触发 vm mounted 狗子
   */
  insert (vnode: MountedComponentVNode) {
    const { context, componentInstance } = vnode
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance)
      } else {
        activateChildComponent(componentInstance, true /* direct */)
      }
    }
  },

  /**
   * vm._isDestroyed 触发 vm.$destroy()
   */
  destroy (vnode: MountedComponentVNode) {
    const { componentInstance } = vnode
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy()
      } else {
        deactivateChildComponent(componentInstance, true /* direct */)
      }
    }
  }
}

const hooksToMerge = Object.keys(componentVNodeHooks)

export function createComponent (
  Ctor: ComponentCtor | Function | Object | void | any,
  data: VNodeData,
  context: Component,
  children: Array<VNodeInstance> | undefined,
  tag?: string
): VNodeInstance | Array<VNodeInstance> | void {
  if (isUndef(Ctor)) {
    return
  }

  const baseCtor = context.$options._base

  // plain options object: turn it into a constructor
  // 支持 传入options 生成组件，将其 Vue.extend(opt)
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(<any>Ctor)
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      warn(`Invalid Component definition: ${String(Ctor)}`, context)
    }
    return
  }

  // async component
  let asyncFactory
  // Ctor.cid 不存在则被当成 异步组件工厂函数
  if (isUndef((<ComponentCtor>Ctor).cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context)
    // 解析的异步组件不存在则创建占位符
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        <VNodeInstance[]>children,
        tag
      )
    }
  }

  data = data || {}

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(<any>Ctor)

  // transform component v-model data into props & events
  // 根据 model 更改默认 v-model 关联的 val 和 事件
  if (isDef(data.model)) {
    transformModel(Ctor.options, data)
  }

  // extract props
  // 从 Ctor.options.props keys 取出 data.props || data.attrs 
  const propsData = extractPropsFromVNodeData(data, Ctor, tag)

  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, <any>children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  const listeners = data.on
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn

  // 抽象组件 data 只保留 data.slot 
  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    const slot = data.slot
    data = {}
    if (slot) {
      data.slot = slot
    }
  }

  // install component management hooks onto the placeholder node
  installComponentHooks(data)

  // return a placeholder vnode
  const name = Ctor.options.name || tag
  // 组件 vnode 特殊命名
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    <any>{ Ctor, propsData, listeners, tag, children },
    asyncFactory
  )

  // Weex specific: invoke recycle-list optimized @render function for
  // extracting cell-slot template.
  // https://github.com/Hanks10100/weex-native-directive/tree/master/component
  /* istanbul ignore if */
  // if (__WEEX__ && isRecyclableComponent(vnode)) {
  //   return renderRecyclableComponentTemplate(vnode)
  // }

  return vnode
}

/**
 * 通过 vnode 与 prent 返回组件实例
 * 其中 componentOptions.Ctor 是创建 vnode  时确认的组件构造函数
 */
export function createComponentInstanceForVnode (
  vnode: any, // we know it's MountedComponentVNode but flow doesn't
  parent: Component, // activeInstance in lifecycle state
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }
  // check inline-template render functions
  // 如果使用了内联模板，则对options 的渲染进行绑定
  const inlineTemplate = vnode.data.inlineTemplate
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render
    options.staticRenderFns = inlineTemplate.staticRenderFns
  }
  return new vnode.componentOptions.Ctor(options)
}

/**
 * 将 vnode.data.hook 与 默认 componentVNodeHooks 进行合并
 * hook._merged
 */
function installComponentHooks (data: VNodeData) {
  const hooks = data.hook || (data.hook = {})
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i]
    const existing:any = hooks[key]
    const toMerge = componentVNodeHooks[key]
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge
    }
  }
}

function mergeHook (f1: any, f2: any): Function {
  const merged = (a:any, b:any) => {
    // flow complains about extra args which is why we use any
    f1(a, b)
    f2(a, b)
  }
  merged._merged = true
  return merged
}

// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel(options: any, data: any) {
  // model.prop
  const prop = (options.model && options.model.prop) || 'value'
  // model.event
  const event = (options.model && options.model.event) || 'input'
  // 将 prop = model.prop => data.props[prop] = data.model.value 
  // v-model="val" => :prop="val" 
  ;(data.props || (data.props = {}))[prop] = data.model.value
  const on = data.on || (data.on = {})
  const existing = on[event]
  const callback = data.model.callback
  // 将 model 绑定的事件回调 关联至 model.event 事件上
  if (isDef(existing)) {
    if (
      Array.isArray(existing)
        ? existing.indexOf(callback) === -1
        : existing !== callback
    ) {
      on[event] = [callback].concat(existing)
    }
  } else {
    on[event] = callback
  }
}
