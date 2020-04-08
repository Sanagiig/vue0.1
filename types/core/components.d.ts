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
    $parent: Component;
    $root: Component;
    $refs: { [key: string]: any };
    $slots: VNode[];
    $scopedSlots: { [key: string]: VNode };
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
    _staticTrees: Array<VNode> | null;
    // 防止被ob
    _isVue: boolean;
    _isMounted: boolean;
    _isDestroyed: boolean;
    _isBeingDestroyed: boolean;
    // 如果有相应的hook则会$emit(xxhook)
    _hasHookEvent: boolean;
    _inactive: boolean | null;
    _directInactive: boolean;
    // vm
    _renderProxy: Component;
    _watcher: WatcherInstance | null;
    _watchers: WatcherInstance[];
    // cb 有可能是带 fn 的对象
    _events:{ [key: string]:Function[] | null | any};
    // 计算属性监听器列表
    _computedWatchers: WatcherInstance[];
    // 已安装的插件
    _installedPlugins: any[];
    _update: Function;

    [key: string]: any;
}