import { ASSET_TYPES } from '@utils/shared/constants';
import { validateComponentName } from '@utils/options';
import { isPlainObject } from '@utils/assert';
import { def } from '../../utils/shared/index';

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
            }
        }
    })
}