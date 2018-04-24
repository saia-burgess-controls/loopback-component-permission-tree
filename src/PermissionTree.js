const cacheManager = require('cache-manager');
const fsStore = require('cache-manager-fs');

/**
 * PermissionTree class builds and handles the permission tree
 * for the given models and methods
 */
module.exports = class PermissionTree {
    constructor(models, remotes, options) {
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
         * Object to hold the builded user permission trees
         * @type {Object}
         */
        this.userPermissionTrees = new Map();

        /**
         * Component options
         * 
         * @type {object}
         */
        this.options = options || {};


        console.log('options', options)

        if (this.options.enableCache) {
            const cacheOptions = {
                ttl: 24*60*60 /* seconds */, 
                maxsize: 1000*1000*1000 /* max size in bytes on disk */, 
                path:'diskcache', 
                preventfill:true
            }
            this.diskCache = cacheManager.caching({store: fsStore, options: cacheOptions});

            this.diskCache.get('userPermissionTrees', (err, result) => {
                if (err) throw err;

                console.log(result);
                this.userPermissionTrees = result ? new Map(JSON.parse(result)) : this.userPermissionTrees;
            });

        }
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

    hasUserPermissionTree(user) {
        return this.userPermissionTrees.has(user.id)
    }

    getUserPermissionTree(user) {
        if (!user) {
            throw new Error('No user was specified while trying to access the users permission tree!');
        }

        if (!this.hasUserPermissionTree(user)) {
            // Deep clone
            this.setUserPermissionTree(user, JSON.parse(JSON.stringify(this.getDefaultTree())));
        }

        return this.userPermissionTrees.get(user.id);
    }

    setUserPermissionTree(user, tree) {
        this.userPermissionTrees.set(user.id, tree);

        if (this.options.enableCache) {
            this.diskCache.set('userPermissionTrees', JSON.stringify([...this.userPermissionTrees]), {}, function(err) {
                if (err) { throw err; }
            });
        }
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
                                if (err) return reject(err);

                                return resolve(accessRequest);
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

    async createPermissionTree(user) {
        if (!user || !user.userGroups) {
            throw new Error('No user was specified while trying to load permission tree!');
        }

        if (this.hasUserPermissionTree(user)) {
            // do not rebuild the tree if it already exists
            return; 
        }

        // Note: Roles are passed as user groups (RoleMapping.GROUP)
        await Promise.all(user.userGroups.map(async(group) => {
            const accessRequests = await this.getACLPermissionsForRole(group);

            this.updatePermissions(user, accessRequests);
        }));
    }

    updatePermissions(user, accessRequests) {
        accessRequests.forEach((accessRequest) => {
            this.setPermission(
                user,
                accessRequest,
                accessRequest.isAllowed(),
            );
        });
    }

    getPermission(user, accessRequest) {
        const userTree = this.getUserPermissionTree(user);

        return userTree[accessRequest.model][accessRequest.property][accessRequest.accessType];
    }

    setPermission(user, accessRequest, allow = false) {
        const userTree = this.getUserPermissionTree(user);
        userTree[accessRequest.model][accessRequest.property][accessRequest.accessType] = allow;

        return this.setUserPermissionTree(user, userTree);
    }

    async getPermissionsForUser(user) {
        await this.createPermissionTree(user);

        return this.getUserPermissionTree(user);
    }

};
