declare interface ComponentCtor {
    new(): Component
    options: ComponentOptions;
    extend: Function;
}

declare interface Component { 
    constructor: ComponentCtor;
    __ob__: any;
    _isBeingDestroyed: boolean;
    _inactive: boolean | null;
    _directInactive: boolean;
    _watchers: Watcher[];
    $children: Component[];
}