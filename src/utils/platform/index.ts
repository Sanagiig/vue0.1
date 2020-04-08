import { makeMap } from '../convert/index';
export * from './perf';

// attributes that should be using props for binding
const acceptValue = makeMap('input,textarea,option,select,progress')
// 带value属性的需要用.prop 隐藏在标签下
export const mustUseProp = (tag: string, type: string | null, attr: string): boolean => {
  return (
    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
}