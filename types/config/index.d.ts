declare type Config = {
     /**
     * Option merge strategies (used in core/util/options)
     */
    // $flow-disable-line
    optionMergeStrategies: { [key: string]: Function };
    
     /**
     * Whether to suppress warnings.
     */
    silent: boolean,

    /**
     * Error handler for watcher errors
     */
    errorHandler?: Function | null,

    /**
     * Warn handler for watcher warns
     */
    warnHandler?:Function | null,
    
    /**
     * Perform updates asynchronously. Intended to be used by Vue Test Utils
     * This will significantly reduce performance if set to false.
     */
    async: boolean,

    /**
     * Whether to enable devtools
     */
    devtools: boolean,

    /**
     * Check if a tag is reserved so that it cannot be registered as a
     * component. This is platform-dependent and may be overwritten.
     */
    isReservedTag: Function,

    /**
     * Check if an attribute is reserved so that it cannot be used as a component
     * prop. This is platform-dependent and may be overwritten.
     */
    isReservedAttr: Function,
    
    /**
     * Parse the real tag name for the specific platform.
     */
    parsePlatformTagName: (x: string) => string;
    
    /**
     * Show production mode tip message on boot?
     */
    productionTip: boolean;

     /**
     * Whether to record perf
     */
    performance: boolean,

    /**
     * Get the namespace of an element
     */
    getTagNamespace: (x?: string) => string | void;
}