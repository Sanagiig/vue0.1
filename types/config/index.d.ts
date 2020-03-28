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
    isReservedTag:Function,
}