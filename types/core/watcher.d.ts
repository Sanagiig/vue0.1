declare interface WatcherCtor{
    new(vm: Component,
        expOrFn: string | Function,
        cb: Function,
        options?: Object,
        isRenderWatcher?: boolean):Watcher;
}

declare interface Watcher {
    vm: Component;
    expression: string;
    cb: Function;
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
    update: Function;
    teardown: Function;
    before: Function;
    getter: Function;
    value: any;
  
  }