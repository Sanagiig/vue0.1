import Watcher from './watcher';
import { callHook,activateChildComponent } from '@core/instance/lifecycle/index';
import { warn } from '@utils/debug';
import { nextTick } from '@utils/next-tick';
import config from '@config/index';
import { devtools } from '@utils/env';

export const MAX_UPDATE_COUNT = 100;

const queue: Watcher[] = [];
const activatedChildren: Component[] = [];
let has: { [key: number]: true | null | false } = {};
// 
let circular: { [key: number]: number } = {};
// 当前队列状态
let flushing = false;
// 
let waiting = false;
let index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}

function callActivatedHooks (queue:Component[]) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true /* true */)
  }
}

function callUpdatedHooks (queue:any[]) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue() {
    let watcher: Watcher, id: number;

    flushing = true;

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    queue.sort((a, b) => a.id - b.id);

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    for (index = 0; index < queue.length; index++) { 
        watcher = queue[index];
        if (watcher.before) {
            watcher.before();
        }

        id = watcher.id;
        has[id] = null;
        watcher.run();
        // in dev build, check and stop circular updates.
        if (process.env.NODE_ENV !== 'production' && has[id] != null) {
            circular[id] = (circular[id] || 0) + 1
            if (circular[id] > MAX_UPDATE_COUNT) {
                warn(
                'You may have an infinite update loop ' + (
                    watcher.user
                    ? `in watcher with expression "${watcher.expression}"`
                    : `in a component render function.`
                ),
                    watcher.vm
                )
                break
            }
        }
    }

    // keep copies of post queues before resetting state
    const activatedQueue = activatedChildren.slice();
    const updatedQueue = queue.slice();

    resetSchedulerState();

    // call component updated and activated hooks
    callActivatedHooks(activatedQueue)
    callUpdatedHooks(updatedQueue)

    // devtool hook
    /* istanbul ignore if */
    if (devtools && config.devtools) {
        devtools.emit('flush')
    }
}


/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher(watcher: Watcher) {
    const id = watcher.id;
    if (has[id] == null) {
        has[id] = true;
        
        if (!flushing) {
            queue.push(watcher);
        } else {
            // if already flushing, splice the watcher based on its id
            // if already past its id, it will be run next immediately.
            let i = queue.length - 1
            while (i > index && queue[i].id > watcher.id) {
                i--;
            }
            queue.splice(i + 1, 0, watcher);
        }

        // queue the flush
        if (!waiting) {
            waiting = true;

            if (process.env.NODE_ENV !== 'production' && !config.async) {
                flushSchedulerQueue();
                return;
            }
            nextTick(flushSchedulerQueue);
        }
    }
}