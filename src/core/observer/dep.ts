import Watcher from "./watcher"
import { remove } from "@utils/shared/index"
let uid = 0;

export default class Dep {
  static target?: WatcherInstance | null;
  id: number;   
  subs: Array<WatcherInstance>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: WatcherInstance) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    //  && !config.async
    if (process.env.NODE_ENV !== 'production') {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack:Array<WatcherInstance | null | undefined>  = []
export function pushTarget(target?:WatcherInstance){
  targetStack.push(target)
  Dep.target = target
}

export function popTarget(){
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}