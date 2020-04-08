import { hasOwn, isObject, isPlainObject } from './assert';
import { warn } from './debug';
import { hyphenate, capitalize, toRawType } from './convert/index';
import {
  shouldObserve,
  toggleObserving,
  observe
} from '@core/observer/index';

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType(fn: any) {
  const match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : '';
}

function isSameType (a:any, b:any) {
  return getType(a) === getType(b);
}

function getTypeIndex(type: any, expectedTypes: any): number {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1;
  }
  for (let i = 0, len = expectedTypes.length; i < len; i++){
    if (isSameType(expectedTypes[i], type)) {
      return i;
    }
  }
  return -1;
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue(
  vm: Component,
  prop: PropOptions,
  key: string
): any {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  const def = prop.default;
  // warn against non-factory defaults for Object & Array
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    )
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (
    vm
    && vm.$options.propsData
    && vm.$options.propsData[key] === undefined
    && vm._props[key] !== undefined) {
    return vm._props[key];
  }

  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def;
}

function getInvalidTypeMessage(name: string, value: any, expectedTypes: any) {
  let message = `Invalid prop: type check failed for prop "${name}".` +
    ` Expected ${expectedTypes.map(capitalize).join(', ')}`;
  const expectedType = expectedTypes[0];
  const receivedType = toRawType(value);
  const expectedValue = styleValue(value, expectedType);
  const receivedValue = styleValue(value, receivedType);
  // check if we need to specify expected value
  if (expectedTypes.length === 1
    && isExplicable(expectedType)
    && !isBoolean(expectedType, receivedType)) {
    message += ` with value ${expectedValue}`;
  }

  message += ` , got ${receivedType}`;
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += `with value ${receivedValue}.`;
  }

  return message;
}

function styleValue(value: any, type: any) {
  if (type === 'String') {
    return `"${value}"`;
  } else if (type === 'Number') {
    return `"${Number(value)}"`;
  } else {
    return `${value}`;
  }
}

const simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/
function assertType(value: any, type: Function): {
  valid: boolean;
  expectedType: string;
} { 
  let valid;
  const expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    const t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }

  return {
    valid,
    expectedType
  }
}

/**
 * Assert whether a prop is valid.
 */
function assertProp(
  prop: PropOptions,
  name: string,
  value: any,
  vm: Component,
  absent: boolean
) {
  if (prop.required && absent) {
    warn('Missing required prop: "' + name + '"',
      vm
    );
    return;
  }
  if (value == null && !prop.required) {
    return;
  }

  let type:any = prop.type;
  let valid = !type || type === true;
  const expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (let i = 0; i < type.length && !valid; i++){
      const assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }

  if (!valid) {
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    );
    return;
  }

  const validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

export function validateProp(
  key: string,
  propOptions: any,
  propsData: any,
  vm?: Component
): any {
  const prop = propOptions[key];
  const absent = !hasOwn(propsData, key);
  let value = propsData[key];
  // boolean casting
  const booleanIndex = getTypeIndex(Boolean, prop.type);
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false;
      // 有Boolean 类型，并且值与 key 相等 或 值为空字符串 则为true
    } else if (value === '' || value === hyphenate(key)) {
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      const stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true;
      }
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(<Component>vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    const prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value);
    toggleObserving(prevShouldObserve);
  }

  let __WEEX__ = false;
  if (process.env.NODE_ENV !== 'production'
    // skip validation for weex recycle-list child component props
    && !(__WEEX__ && isObject(value) && ('@binding' in value))) {
    assertProp(prop, key, value, <Component>vm, absent);
  }
  return value;
}

function isExplicable (value:string) {
  const explicitTypes = ['string', 'number', 'boolean']
  return explicitTypes.some(elem => value.toLowerCase() === elem)
}

function isBoolean (...args:any) {
  return args.some((elem:any) => elem.toLowerCase() === 'boolean')
}