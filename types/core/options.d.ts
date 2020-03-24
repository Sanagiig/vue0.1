declare type ComponentOptions = {
    // assets
    directives?: { [key: string]: Object };
    components?: { [key: string]: Component };
    filters?: { [key: string]: Function };
    [key: string]: any;

    // private
    _base: ComponentCtor;
}