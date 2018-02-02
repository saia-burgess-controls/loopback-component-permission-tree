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

        /**
         * Object to hold the builded user permission trees
         * @type {Object}
         */
        this.userPermissionTrees = {}
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


    getUserPermissionTree() {
        if (!this.currentUser) {
            throw new Error('No user was specified while trying to access the users permission tree!');
        }
        const userId = this.currentUser.id;

        if (!this.userPermissionTrees[userId]) {
            // Deep clone
            this.userPermissionTrees[userId] = JSON.parse(JSON.stringify(this.getDefaultTree()));
            return this.userPermissionTrees[userId];
        }

        return this.userPermissionTrees[userId];
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
        if (!this.currentUser || !this.currentUser.userGroups) {
            throw new Error('No user was specified while trying to load permission tree!');
        }

        // Note: Roles are passed as user groups (RoleMapping.GROUP)
        await Promise.all(this.currentUser.userGroups.map(async(group) => {
            const accessRequests = await this.getACLPermissionsForRole(group);

            this.updatePermissions(accessRequests);
        }));
    }

    updatePermissions(accessRequests) {
        accessRequests.forEach((accessRequest) => {
            if (
                !this.getPermission(
                    accessRequest.model,
                    accessRequest.property,
                    accessRequest.accessType
                ) &&
                accessRequest.isAllowed()
            ) {
                this.setPermission(
                    accessRequest.model,
                    accessRequest.property,
                    accessRequest.accessType,
                    true
                );
            }
        });
    }

    getPermission(modelName, remoteMethod, accessType) {
        const userTree = this.getUserPermissionTree();

        return userTree[modelName][remoteMethod][accessType];
    }

    setPermission(modelName, remoteMethod, accessType, allow = true) {
        const userTree = this.getUserPermissionTree();

        userTree[modelName][remoteMethod][accessType] = allow;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // FIXME: pass user trough asyn tree
    async getPermissionsForUser(user) {
        this.setCurrentUser(user);
        await this.createPermissionTreeForCurrentUser();

        return this.getUserPermissionTree();
    }

};
