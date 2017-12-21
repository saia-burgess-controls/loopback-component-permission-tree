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

        /**
         * The current loopback user
         * @type {Object}
         */
        this.currenUser = null;
    }

    _buildDefaultTree() {
        const defaultTree = {};

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

    getDefaultTree() {
        if (this.defaultTree) {
            return this.defaultTree;
        }

        return this._buildDefaultTree();
    }


    buildACLQueries(roleName) {
        const promises = [];
        const defaultTree = this.getDefaultTree();

        Object.keys(defaultTree).forEach((modelName) => {
            Object.keys(defaultTree[modelName]).forEach((remoteMethod) => {
                Object.keys(defaultTree[modelName][remoteMethod]).forEach((accessType) => {
                    promises.push(new Promise((resolve, reject) => {
                        this.models.ACL.checkPermission(
                            this.models.RoleMapping.ROLE,
                            roleName,
                            modelName,
                            remoteMethod,
                            accessType,
                            (err, accessRequest) => {
                                if (err) reject(err);

                                resolve(accessRequest);
                            },
                        );
                    }));
                });
            });
        });

        return promises;
    }

    async getACLPermissionsForRole(role) {
        return Promise.all(this.buildACLQueries(role));
    }

    async createPermissionTreeForCurrentUser() {
        console.log('this.currentUser', this.currentUser);
        console.log('userGroups', this.currentUser.userGroups);

        if (!this.currentUser || !this.currentUser.userGroups) {
            throw new Error('No user was specified while trying to load permission tree!');
        }

        this.currentUser.userGroups.forEach(async(role) => {
            const accessRequests = await this.getACLPermissionsForRole(role);

            console.log('accessRequests', accessRequests);
        });
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    getCurrentUser() {
        return this.currentUser;
    }
};
