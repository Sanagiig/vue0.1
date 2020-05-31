type Config = {
    /**
     * Option merge strategies (used in core/util/options)
     */
    // $flow-disable-line
    optionMergeStrategies: { [key: string]: Function };
    
    /**
     * Whether to suppress warnings.
     */
    silent: boolean;

    /**
     * Show production mode tip message on boot?
     */
    productionTip: boolean;

     /**
     * Whether to record perf
     */
    performance: boolean;

    /**
     * Whether to enable devtools
     */
    devtools: boolean;

    /**
     * Error handler for watcher errors
     */
    errorHandler?: (err: Error, vm: Component, info: string) => void;

    /**
     * Warn handler for watcher warns
     */
    warnHandler?: (msg: string, vm: Component, trace: string) => void;

    /**
     * Ignore certain custom elements
     */
    ignoredElements: Array<string | RegExp>;

    /**
     * Custom user key aliases for v-on
     */
    // $flow-disable-line
    keyCodes: { [key: string]: number | Array<number> };
    
    // platform
    /**
     * Check if a tag is reserved so that it cannot be registered as a
     * component. This is platform-dependent and may be overwritten.
     */
    isReservedTag: (x?: string) => boolean;

    /**
     * Check if an attribute is reserved so that it cannot be used as a component
     * prop. This is platform-dependent and may be overwritten.
     */
    isReservedAttr: (x?: string) => boolean;

    /**
     * Parse the real tag name for the specific platform.
     */
    parsePlatformTagName: (x: string) => string;

    /**
     * Check if a tag is an unknown element.
     * Platform-dependent.
     */
    isUnknownElement: (x?: string) => boolean;

    /**
     * Get the namespace of an element
     */
    getTagNamespace: (x?: string) => string | void;

    /**
     * Check if an attribute must be bound using property, e.g. value
     * Platform-dependent.
     */
    mustUseProp: (tag: string, type: string, name: string) => boolean;
  
    /**
     * Perform updates asynchronously. Intended to be used by Vue Test Utils
     * This will significantly reduce performance if set to false.
     */
    async: boolean;
  
    /**
     * Exposed for legacy reasons
     */
    _lifecycleHooks: Array<string>;
  };