declare interface ComponentCtor {
    new ():Component
}

declare interface Component { 
    constructor: ComponentCtor;
    _watchers:Watcher[]
}