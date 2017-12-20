/**
 * PermissionTree class builds and handels the permission tree
 * for the given models and methods
 */
module.exports = class PermissionTree {
    constructor(models, remotes) {
        /**
         * Loopback data models
         * @type {Array}
         */
        this.models = models;

        /**
         * Loopback remote methods
         * @type {Array}
         */
        this.remotes = remotes;

        /**
        * Loopback access types
        *
        * @type {Array}
        */
        this.ACCESS_TYPES = ['READ', 'REPLICATE', 'WRITE', 'EXECUTE'];
    }

    buildDefaultTree() {
        if (this.defaultTree) {
            return this.defaultTree;
        }
        const defaultTree = [];

        Object.values(this.models).forEach((model) => {
            if (model.shared) {
                defaultTree[model.modelName] = {};
                if (this.remotes._classes[model.modelName]) {
                    const methods = this.remotes._classes[model.modelName]._methods;
                    Object.values(methods).forEach((method) => {
                        defaultTree[model.modelName][method.name] = {};

                        this.ACCESS_TYPES.forEach((accessType) => {
                            defaultTree[model.modelName][method.name][accessType] = false;
                        });
                    });
                }
            }
        });

        this.defaultTree = defaultTree;
        return this.defaultTree;
    }
};
