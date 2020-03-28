declare type ComponentOptions = {

    // assets
    directives?: { [key: string]: Object };
    components?: { [key: string]: Component };
    filters?: { [key: string]: Function };
    // private
    // 使用Vue.extend 时会为options生成，key为父Vue 的cid
    _Ctor: {
        [key:number] : ComponentCtor
    };
    _base: ComponentCtor
    
    [key: string]: any | void;
}