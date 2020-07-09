import {
  warn,
  once,
  isDef,
  isUndef,
  isTrue,
  isObject,
  hasSymbol,
  isPromise
} from '@utils/index';

import { createEmptyVNode } from '@core/vdom/vnode';

/**
 * comp.__esModule || hasSymbol && comp[Symbol.toStringTag === 'Module']
 * 如果组件是 es 模块 mark 则取其 default
 * 最后返回 Vue 的继承 或 comp
 */
function ensureCtor (comp: any, base:any) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default
  }
  return isObject(comp)
    ? base.extend(comp)
    : comp
}

/**
 * 创建异步占位符 (node.asyncFactory, node.asyncMeta)
 */
export function createAsyncPlaceholder (
  factory: Function,
  data: VNodeData | null,
  context: Component,
  children: Array<VNodeInstance> | null,
  tag: string | void
): VNodeInstance {
  const node = createEmptyVNode()
  node.asyncFactory = factory
  node.asyncMeta = { data, context, children, tag }
  return node
}

/**
 * 如果 factory 有 [ error resolved loading ] 状态则返回相应解析后的组件
 * 将 context 关联至 factory.contexts 中(可多个),首次关联会 sync = true
 * forceRender 将所有 contexts.$forceUpdate()
 * resolve 将 ensureCtor(res, baseCtor) 作为 factory.resolved 
 * \!sync(当一部组件解析完) 时强制刷新, 并清空 factory.contexts
 * reject 提示组件解析失败 如果 factory.errorComp 存在则 factory.error = true
 * 并强制刷新
 * 通过工厂函数获取组件对象 res = factory(resolve, reject)
 * res is promise || res.component is promise || res.error => factory.errorComp ||
 * res.loading (delay)  || res.timeout 超时未 factory.resolved 则 reject()
 */
export function resolveAsyncComponent (
  factory: any,
  baseCtor: ComponentCtor,
  context: Component
): ComponentCtor | void {
  // 错误
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }

  // 如果已被解析则直接返回
  if (isDef(factory.resolved)) {
    return factory.resolved
  }

  // 加载中则 loadingComp
  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    return factory.loadingComp
  }

  // 存在上下文压栈
  if (isDef(factory.contexts)) {
    // already pending
    factory.contexts.push(context)
  } else {
    const contexts = factory.contexts = [context]
    let sync = true

    // 所有 vm 强制更新
    const forceRender = (renderCompleted: boolean) => {
      for (let i = 0, l = contexts.length; i < l; i++) {
        contexts[i].$forceUpdate()
      }

      if (renderCompleted) {
        contexts.length = 0
      }
    }

    // 缓存组件构造函数到 resolved
    const resolve = once((res: any) => {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor)
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender(true)
      }
    })

    // 提示 factory 渲染失败
    // 如果存在失败组件 则 会强制更新 vms 并对 factory.error
    const reject = once((reason:string) => {
      process.env.NODE_ENV !== 'production' && warn(
        `Failed to resolve async component: ${String(factory)}` +
        (reason ? `\nReason: ${reason}` : '')
      )
      if (isDef(factory.errorComp)) {
        factory.error = true
        forceRender(true)
      }
    })

    const res = factory(resolve, reject)

    if (isObject(res)) {
      if (isPromise(res)) {
        // () => Promise
        // factor 返回 promise 则 then
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject)
        }

        // res.component 
      } else if (isPromise(res.component)) {
        res.component.then(resolve, reject)

        // res error
        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor)
        }
        
        // res loading
        // 如果是 loading 则 根据 delay 决定是否延时加载 loadingComp
        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor)
          if (res.delay === 0) {
            factory.loading = true
          } else {
            setTimeout(() => {
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true
                forceRender(false)
              }
            }, res.delay || 200)
          }
        }

        // res timeout 超时时间，过时则 reject
        if (isDef(res.timeout)) {
          setTimeout(() => {
            if (isUndef(factory.resolved)) {
              reject(
                process.env.NODE_ENV !== 'production'
                  ? `timeout (${res.timeout}ms)`
                  : null
              )
            }
          }, res.timeout)
        }
      }
    }

    sync = false
    // return in case resolved synchronously
    return factory.loading
      ? factory.loadingComp
      : factory.resolved
  }
}
