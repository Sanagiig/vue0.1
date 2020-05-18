declare interface WatcherCtor{
    new(vm: Component,
        expOrFn: string | Function,
        cb: Function,
        options?: Object,
        isRenderWatcher?: boolean):WatcherInstance;
}

declare interface WatcherInstance {
    vm: Component;
    expression: string;
    cb: Function;
    evaluate: () => void;
    depend: () => void;
    id: number;
    deep: boolean;
    user: boolean;
    lazy: boolean;
    sync: boolean;
    dirty: boolean;
    // 实例化时自动 true
    active: boolean;
    deps: Array<Dep>;
    newDeps: Array<Dep>;
    depIds: SimpleSet;
    newDepIds: SimpleSet;
    addDep: Function;
    update: Function;
    cleanupDeps: Function;
    teardown: Function;
    before?: Function;
    getter: Function;
    value: any;
    run:Function;
}
  
declare type WatcherOption = {
    // 是否用户创建
    user?: boolean;
    // 是否立即cb
    imediate?: boolean;
    deep?: boolean;
    lazy?: boolean;
    sync?: boolean;
    before?: Function;
    handler?: Function;
}