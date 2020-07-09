declare type InternalComponentOptions = {
    _isComponent: boolean;
    parent: Component;
    _parentVnode: VNodeInstance;
    render?: Function;
    staticRenderFns?: Array<Function>
};

  type InjectKey = string | Symbol;
declare type ComponentOptions = {
    componentId?: string;
  
    // data
    data?: Object | Function;
    props?: { [key: string]: PropOptions };
    propsData?: any;
    computed?: {
      [key: string]: Function | {
        get?: Function;
        set?: Function;
        cache?: boolean
      }
    };
    methods?: { [key: string]: Function };
    watch?: { [key: string]: Function | string };
  
    // DOM
    el?: string | Element;
    template?: string;
    render: (h: () => VNodeInstance,c?:any) => VNodeInstance;
    renderError?: (h: () => VNodeInstance, err: Error) => VNodeInstance;
    staticRenderFns?: Array<() => VNodeInstance>;
  
    // lifecycle
    beforeCreate?: Function;
    created?: Function;
    beforeMount?: Function;
    mounted?: Function;
    beforeUpdate?: Function;
    updated?: Function;
    activated?: Function;
    deactivated?: Function;
    beforeDestroy?: Function;
    destroyed?: Function;
    errorCaptured?: () => boolean | void;
    ssrPrefetch?: Function;
  
    // assets
    directives?: { [key: string]: Object };
    components?: { [key: string]: ComponentCtor };
    transitions?: { [key: string]: Object };
    filters?: { [key: string]: Function };
  
    // context
    provide?: () => { [key: string ]: any } | { [key: string ]: any };
    inject?: { [key: string]: InjectKey | { from?: InjectKey, default?: any }} | Array<string>;
  
    // component v-model customization
    model?: {
      prop?: string;
      event?: string;
    };
  
    // misc
    parent?: Component;
    mixins?: Array<ComponentOptions | ComponentCtor>;
    name?: string;
    extends?: ComponentCtor | ComponentOptions;
    delimiters?: [string, string];
    comments?: boolean;
    inheritAttrs?: boolean;
  
    // private
    _isComponent?: true;
    _propKeys?: string[];
    _parentVnode?: VNodeInstance | void;
    _parentListeners?: Object;
    _renderChildren?: VNodeInstance[];
    _componentTag: string;
    _scopeId: string;
    _base: ComponentCtor;
    [key: string]: any | void;
}

declare type PropOptions = {
    type: Function | Array<Function> | null;
    default: any;
    required: boolean;
    validator: Function;
}
  