import {
  ASSET_TYPES,
  extend,
  mergeOptions,
  validateComponentName
} from '@utils/index';
import { defineComputed, proxy } from '@core/instance/state'

export function initExtend(Vue: GlobalAPI) {
   /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  let cid = 1;

  /**
   * 通过 extendOptions 继承 Vue , 返回一个 VueSup 构造函数, 
   * 同时该构造函数会作为 Vue 的子组件记录至 Vue.components 中
   * 如果 extendOptions._Ctor map 中存在 Super.cid 的对应,则直接返回
   * 继承步骤:
   * 1. 将 {...super.prototype} 作为 sub.prototype
   * 2. 修改 sub.prototype.constructor , sub.cid = cid ++
   * 3. 将 super.options && extendOptions 合并，作为 sub.options
   * 4. sub.super = super
   * 5. sub.options.props 的 keys 取出, sub.prototype[key] 映射至 sub.prototype._prop[key]
   * 6. initProps initComputed 避免多次 defindProperty ?? mark
   * 7. extend mixin use asserts 静态方法
   * 8. superOptions extendOptions(当前extendOptions)  sealedOptions(sub.options)
   */
  Vue.extend = function (
    this: ComponentCtor,
    extendOptions: ComponentOptions = <ComponentOptions>{}
  ): Function{
    const Super = this;
    const SuperId = Super.cid;
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});

    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId];
    }

    const name = extendOptions.name || Super.options.name;
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name);
    }

    const Sub:any = function VueComponent(this: Component, options: ComponentOptions) {
      this._init(options);
    }
    // 继承 super.prototype ， cid++
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(Super.options, extendOptions);
    Sub['super'] = Super;

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps(Sub);
    }
    if (Sub.options.computed) {
      initComputed(Sub);
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub;
  }
}

// _props 映射
function initProps(Comp: Component) {
  const props = Comp.options.props;
  for (const key in props) {
    proxy(Comp.prototype, '_props', key);
  }
}

// options.computed keys => 都重新定义, 将其缓存取值都关联到 sub.prototype
// 
function initComputed(Comp: Component) {
  const computed = Comp.options.computed;
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key]);
  }
}