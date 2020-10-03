declare interface ComponentCtor {
    new(options: ComponentOptions): Component;
    options: ComponentOptions;

    /**
     * 扩展相关
     */
    extend: Function;
    superOptions: ComponentOptions;
    // extend 扩展时的选项
    extendOptions: ComponentOptions;
    // 与父vue 合并后的选项作为 opts的备份，为opts更改后做参考
    sealedOptions: ComponentOptions;

    [key: string]: any;
}

declare interface Component {
    constructor: ComponentCtor;

    /**
     * public properties
     */
    $el: Element;
    $children: Component[];
    $options: ComponentOptions;
    $on: Function;
    $off: Function;
    $emit: Function;
    $watch: Function;
    $mount: Function;
    $parent?: Component;
    $root: Component;
    $refs: { [key: string]: any };
    $slots: VNodeInstance[];
    $scopedSlots: { [key: string]: VNodeInstance };
    $vnode?: VNodeInstance | void; // the placeholder node for the component in parent's render tree
    $createElement: (a: any, b: any, c: any, d: any) => Function;
    
    /**
     * private properties
     */
    _name: string;
    _uid: number;
    // ob 对象
    __ob__: any;
    _data: { [key: string]:any };
    _props: { [key: string]: any };
    // provide obj
    _provided:{ [key: string]: any };
    // v-once cached trees
    _staticTrees: Array<VNodeInstance> | null;
    // 防止被ob
    _isVue: boolean;
    _isMounted: boolean;
    _isDestroyed: boolean;
    _isBeingDestroyed: boolean;
    // 如果有相应的hook则会$emit(xxhook)
    _hasHookEvent: boolean;
    // 组件 inactive 状态
    _inactive: boolean | null;
    // 组件指令 inactive 状态 ？？
    _directInactive: boolean;
    // vm
    _renderProxy: Component;
    // vm 实例更新 watcher
    _watcher: WatcherInstance | null;
    _watchers: WatcherInstance[];
    // cb 有可能是带 fn 的对象
    _events:{ [key: string]:Function[] | null | any};
    // 计算属性监听器列表
    _computedWatchers: WatcherInstance[];
    // 已安装的插件
    _installedPlugins: any[];
    _update: Function;

    // createElement

  // _c is internal that accepts `normalizationType` optimization hint
  _c: (
    vnode?: VNodeInstance,
    data?: VNodeData,
    children?: VNodeChildren,
    normalizationType?: number
  ) => VNodeInstance | void;

  // renderStatic
  _m: (index: number, isInFor?: boolean) => VNodeInstance | VNodeChildren;
  // markOnce
  _o: (vnode: VNodeInstance | Array<VNodeInstance>, index: number, key: string) => VNodeInstance | VNodeChildren;
  // toString
  _s: (value: any) => string;
  // text to VNode
  _v: (value: string | number) => VNodeInstance;
  // toNumber
  _n: (value: string) => number | string;
  // empty vnode
  _e: () => VNodeInstance;
  // loose equal
  _q: (a: any, b: any) => boolean;
  // loose indexOf
  _i: (arr: Array<any>, val: any) => number;
  // resolveFilter
  _f: (id: string) => Function;
  // renderList
  _l: (val: any, render: RenderFn) => Array<VNodeInstance>;
  // renderSlot
  _t: (name: string, fallback: Array<VNodeInstance>, props: any,bindObject: any) => Array<VNodeInstance>;
  // apply v-bind object
  _b: (data: any, tag: string, value: any, asProp: boolean, isSync?: boolean) => VNodeData;
  // apply v-on object
  _g: (data: any, value: any) => VNodeData;
  // check custom keyCode
  _k: (eventKeyCode: number, key: string, builtInAlias?: number | Array<number>, eventKeyName?: string,builtInKeyName?: string | Array<string>) => boolean | undefined;
  // resolve scoped slots
  _u: (scopedSlots: ScopedSlotsData, res?: any) => { [key: string]: Function };

  // SSR specific
  _ssrNode: Function;
  _ssrList: Function;
  _ssrEscape: Function;
  _ssrAttr: Function;
  _ssrAttrs: Function;
  _ssrDOMProps: Function;
  _ssrClass: Function;
  _ssrStyle: Function;

  [key: string]: any;
}