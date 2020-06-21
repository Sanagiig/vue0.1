import config from '@config/index';
import { hyphenate } from '@utils/index';

// A 如果不存在 E || A !== E 则返回 true 
function isKeyNotMatch<T> (expect: T | Array<T>, actual: T): boolean {
  if (Array.isArray(expect)) {
    return expect.indexOf(actual) === -1
  } else {
    return expect !== actual
  }
}

/**
 * Runtime helper for checking keyCodes from config.
 * exposed as Vue.prototype._k
 * passing in eventKeyName as last argument separately for backwards compat
 */
/**
 * 对比 builtKeyName 与 $event.key ||
 * 对比 builtKeyCode 与 $event.keyCode
 * hyphenate($event.key) !== key
 */
export function checkKeyCodes (
  eventKeyCode: number,
  key: string,
  builtInKeyCode?: number | Array<number>,
  eventKeyName?: string,
  builtInKeyName?: string | Array<string>
): boolean | undefined {
  // 默认无 config.keyCodes  
  const mappedKeyCode = config.keyCodes[key] || builtInKeyCode
  // 默认对比事件 name 与 修饰符对应 name
  if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
    // 事件中的key 不与 定义的key 相等
    return isKeyNotMatch(builtInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    // 默认对比keyCode 与 eventKeyCode
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    // keyName => key-name !== key
    return hyphenate(eventKeyName) !== key
  }
}
