/**
 * 对比 slots 、 normalSlots 生成新 res ，
 * 如果 key in normalSlots && key not in slots ,则取 _ => normalSlots[key]
 */
export function normalizeScopedSlots(
  slots: { [key: string]: Function } | void,
  normalSlots: { [key: string]: Array<VNodeInstance> }
): any {
  let res:any;
  if (!slots) {
    res = {};
  } else if (slots._normalized) {
    return slots;
  } else {
    res = {};
    for (const key in slots) {
      if (slots[key]) {
        res[key] = normalizeScopedSlot(slots[key]);
      }
    }
  }

  // expose normal slots on scopedSlots
  // 将不存在与 slots （父未传入 scopedSlot）, 的key 转换为 proxy fn
  for (const key in normalSlots) {
    if (!(key in res)) {
      res[key] = proxyNormalSlot(normalSlots, key);
    }
  }
  res._normalized = true;
  return res;
}

/**
 * 返回 func , func 将fn 的返回值进行处理 ， 返回合法的 [res] || res(null)
 */
function normalizeScopedSlot(fn: Function) {
  return (scope: any) => {
    const res = fn(scope);
    return Array.isArray(res) ? res : res ? [res] : res;
  }
}

function proxyNormalSlot(slots:any, key:any) {
  return () => slots[key]
}
