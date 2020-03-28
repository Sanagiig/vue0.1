import { no } from '@utils/shared/index';

const config: Config = {
     /**
     * Option merge strategies (used in core/util/options)
     */
    // $flow-disable-line
    optionMergeStrategies: {},

    /**
     * Whether to suppress warnings.
     */
    silent: false,
    /**
     * Error handler for watcher errors
     */
    errorHandler: null,
    
    /**
     * Warn handler for watcher warns
     */
    warnHandler: null,
    
    /**
     * Whether to enable devtools
     */
    devtools: process.env.NODE_ENV !== 'production',

    /**
     * Perform updates asynchronously. Intended to be used by Vue Test Utils
     * This will significantly reduce performance if set to false.
     */
    async: false,
    
    /**
     * Check if a tag is reserved so that it cannot be registered as a
     * component. This is platform-dependent and may be overwritten.
     */
    isReservedTag: no,
}

export default config;