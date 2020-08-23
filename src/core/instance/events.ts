import {
  tip,
  formatComponentName,
  hyphenate,
  toArray,
  invokeWithErrorHandling,
  updateListeners
} from '@utils/index';

let target: Component;

function add (event:any, fn:Function) {
  target.$on(event, fn);
}

function remove (event:any, fn:Function) {
  target.$off(event, fn);
}

/**
 * on off emit
 */
export function eventsMixin(Vue: ComponentCtor) {
  const hookRE = /^hook:/;
  Vue.prototype.$on = function (
    this:Component,
    event: string | string[],
    fn: Function): Component{
    const vm = this;
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++){
        vm.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean 
      // flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm;
  }

  Vue.prototype.$off = function (
    this:Component,
    event?: string | string[],
    fn?: Function):Component {
    const vm = this;
    // 清除所有
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm;
    }

    // array of events
    if (Array.isArray(event)) {
      for (let i = 0, l = event.length; i < l; i++) {
        vm.$off(event[i], fn);
      }
      return vm
    }

    // specific event
    const cbs = vm._events[(<string>event)];
    if (!cbs) {
      return vm;
    }
    if (!fn) {
      vm._events[<string>event] = null;
      return vm;
    }
    let cb;
    let i = cbs.length;
    while (i--) {
      cb = cbs[i];
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1);
        break;
      }
    }
    return vm;
  }

  // 触发 this._events[event]
  Vue.prototype.$emit = function (this:Component,event: string) {
    const vm = this;
    if (process.env.NODE_ENV !== 'production') {
      const lowerCaseEvent = event.toLowerCase();
      // 大小写错误提示
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          `Event "${lowerCaseEvent}" is emitted in component ` +
          `${formatComponentName(vm)} but the handler is registered for "${event}". ` +
          `Note that HTML attributes are case-insensitive and you cannot use ` +
          `v-on to listen to camelCase events when using in-DOM templates. ` +
          `You should probably use "${hyphenate(event)}" instead of "${event}".`
        )
      }
    }
    let cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      const args = toArray(arguments, 1);
      const info = `event handler for "${event}"`;
      for (let i = 0, l = cbs.length; i < l; i++){
        invokeWithErrorHandling(cbs[i], vm, args, vm, info);
      }
    }
    return vm;
  }
}

export function initEvents(vm: Component) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;

  // init parent attached events
  // 初始化父组件传入的 listeners
  const listeners = vm.$options._parentListeners;
  if (listeners) {
    // 为子组件新增父组件的监听方法
    updateComponentListeners(vm, listeners);
  }
}

function createOnceHandler(event: any, fn: Function) {
  const _target = target;
  return function onceHandler() {
    const res = fn.apply(null, arguments);
    if (res !== null) {
      _target.$off(event, onceHandler);
    }
  }
}

export function updateComponentListeners(
  vm: Component,
  listeners: Object,
  oldListeners?: Object
) {
  target = vm;
  updateListeners(
    listeners,
    oldListeners || {},
    add, remove, createOnceHandler, vm
  );
  target = <any>undefined;
}