import config from '@config/index';
import { noop } from '@utils/shared/index';

export let warn = noop;
export let tip = noop;
export let generateComponentTrace = (noop) // work around flow check
export let formatComponentName = (noop)

if (process.env.NODE_ENV !== 'production') {
  const hasConsole = typeof console !== 'undefined'
  const classifyRE = /(?:^|[-_])(\w)/g
  const classify = (str:string) => str
    .replace(classifyRE, c => c.toUpperCase())
    .replace(/[-_]/g, '')

  /**
   * 将 vm 的 trace(vm 向上的结构) 与 msg 一起打印出来
   */
  warn = (msg, vm) => {
    const trace = vm ? generateComponentTrace(vm) : ''

    if (config.warnHandler) {
      (<any>config.warnHandler).call(null, msg, vm, trace)
    } else if (hasConsole && (!config.silent)) {
      console.error(`[Vue warn]: ${msg}${trace}`)
    }
  }

  tip = (msg, vm) => {
    if (hasConsole && (!config.silent)) {
      console.warn(`[Vue tip]: ${msg}` + (
        vm ? generateComponentTrace(vm) : ''
      ))
    }
  }

  /**
   * 返回经过整理的组件名称 <ComponentName>
   */
  formatComponentName = (vm, includeFile) => {
    if (vm.$root === vm) {
      return '<Root>'
    }
    // 取vm.options || Vue.options
    const options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm
    let name = options.name || options._componentTag
    const file = options.__file
    if (!name && file) {
      const match = file.match(/([^/\\]+)\.vue$/)
      name = match && match[1]
    }

    return (
      (name ? `<${classify(name)}>` : `<Anonymous>`) +
      (file && includeFile !== false ? ` at ${file}` : '')
    )
  }

  const repeat = (str:string, n:number) => {
    let res = ''
    while (n) {
      if (n % 2 === 1) res += str
      if (n > 1) str += str
      n >>= 1
    }
    return res
  }

  /**
   * 将 vm 自底向上检索, 所有的节点都存入 tree
   * 当有递归引用 <x><x></x></x> 则会将其递归数记录下来，打印时进行优化
   * 避免重复过多的 <tag>
   * ---> repet(' ',5 + i * 2) <ComponentName>
   */
  generateComponentTrace = vm => {
    if (vm._isVue && vm.$parent) {
      const tree:Object[] = []
      let currentRecursiveSequence = 0
      while (vm) {
        if (tree.length > 0) {
          const last = tree[tree.length - 1]
          // 如果vm 属于同一个ctor 则不入栈
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++
            vm = vm.$parent
            continue
            // 非首个不相同ctor 的vm 将入栈，并在上一个栈中增加计数器
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence]
            currentRecursiveSequence = 0
          }
        }
        tree.push(vm)
        vm = vm.$parent
      }
      return '\n\nfound in\n\n' + tree
        .map((vm, i) => `${
          i === 0 ? '---> ' : repeat(' ', 5 + i * 2)
        }${
          Array.isArray(vm)
            ? `${formatComponentName(vm[0])}... (${vm[1]} recursive calls)`
            : formatComponentName(vm)
        }`)
        .join('\n')
    } else {
      return `\n\n(found in ${formatComponentName(vm)})`
    }
  }
}

