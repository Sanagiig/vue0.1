declare type InternalComponentOptions = {
    _isComponent: boolean;
    parent: Component;
    _parentVnode: VNode;
    render?: Function;
    staticRenderFns?: Array<Function>
  };

declare type ComponentOptions = {
    // data
    data?:{ [key: string]: any };
    props?: { [key: string]: PropOptions };
    propsData?: any;
    // 类似抽象类
    abstract?: boolean;
    provide?: { [key: string]: any };
    inject?: { [key: string]: any };
    methods?: { [key: string]: any };
    computed?: { [key: string]: any };
    watch?: { [key: string]: any };
    
    // assets
    directives?: { [key: string]: Object };
    components?: { [key: string]: Component };
    filters?: { [key: string]: Function };
    parent: Component;
    render?: Function;
    staticRenderFns?: Array<Function>

    // private
    _isComponent: boolean;
    // 使用Vue.extend 时会为options生成，key为父Vue 的cid
    _Ctor: {
        [key:number] : ComponentCtor
    };
    _base: ComponentCtor
    _parentVnode: VNode;
    _parentListeners?: { [key: string]:any };
    _renderChildren?: VNode[];
    _componentTag: string;
    [key: string]: any | void;
}

declare type PropOptions = {
    type: Function | Array<Function> | null;
    default: any;
    required: boolean;
    validator: Function;
}
  