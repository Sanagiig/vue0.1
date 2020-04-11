import { no,noop } from '@utils/index';
import { identity } from '../utils/env';

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

    /**
     * Check if a tag is an unknown element.
     * Platform-dependent.
     */
    isUnknownElement: no,

    /**
     * Check if an attribute is reserved so that it cannot be used as a component
     * prop. This is platform-dependent and may be overwritten.
     */
    isReservedAttr: no,

    /**
     * Get the namespace of an element
     */
    getTagNamespace: noop,

    /**
     * Parse the real tag name for the specific platform.
     */
    parsePlatformTagName: identity,

    /**
     * Show production mode tip message on boot?
     */
    productionTip: false,

    /**
     * Whether to record perf
     */
    performance: false,
}

export default config;