import { def } from '@utils/shared/index';

const arrayProto: { [key: string]: any } = Array.prototype;
export const arrayMethods = Object.create(arrayProto);

const methodsToPatch:string[] = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method: string) {
    // cache original method
    const original = arrayProto[method];
    def(arrayMethods, method, function mutator(this: Component, ...args: any[]) {
        const result = original.apply(this, args);
        const ob = this.__ob__;
        let inserted;
        switch (method) {
            case 'push':
            case 'unshift':
                inserted = args;
                break;
            case 'splice':
                inserted = args.slice(2);
                break;
        }

        if (inserted) ob.observeArray(inserted);
        // notify change
        ob.dep.notify();
        return result;
    })
})