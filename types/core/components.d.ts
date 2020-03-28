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
    // 与父vue 合并后的选项
    sealedOptions: ComponentOptions;

    [key: string]: any;
}

declare interface Component {
    constructor: ComponentCtor;

    /**
     * public properties
     */
    $children: Component[];

    /**
     * private properties
     */
    // ob 对象
    __ob__: any;
    _isBeingDestroyed: boolean;
    _inactive: boolean | null;
    _directInactive: boolean;
    _watchers: Watcher[];
    // 计算属性监听器列表
    _computedWatchers: Watcher[];
    // 已安装的插件
    _installedPlugins: any[];

    [key: string]: any;
}