import { ASSET_TYPES } from '@utils/shared/constants';
import { validateComponentName } from '@utils/options';
import { isPlainObject } from '@utils/assert';

/**
 * 通过 this[type][id] 从 options[type + 's'] 中获取已经注册的资源
 * component 会根据 id 修改 组件的 name, 然后将其定义
 * 通过 Vue.options._base.extend(def) 返回一个新的 Vue 子构造函数
 * directive 会将 fn 关联至 {bind,update}
 */
export function initAssetRegisters(Vue: GlobalAPI) {
    ASSET_TYPES.forEach((type) => {
        Vue[type] = function (
            this: ComponentCtor,
            id: string,
            definition: Component | any): Component | void{
            if (!definition) {
                return this.options[type + 's'][id];
            } else {
                /* istanbul ignore if */
                if (process.env.NODE_ENV !== 'production' && type === 'component') {
                    validateComponentName(id)
                }
                if (type === 'component' && isPlainObject(definition)) {
                    definition.name = definition.name || id;
                    definition = this.options._base.extend(definition);
                }
                if (type === 'directive' && typeof definition === 'function') {
                    definition = { bind: definition, update: definition };
                }
                this.options[type + 's'][id] = definition;
                return definition;
            }
        }
    })
}