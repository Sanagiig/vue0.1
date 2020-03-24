declare interface GlobalAPI {
    directive: (id: string, def?: Function | any) => Function | any | void;
    component: (id: string, def?: ComponentCtor | any) => ComponentCtor;
    filter: (id: string, def?: Function) => Function | void;
    [key: string]: any;
}