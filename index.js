const PermissionTree = require('./src/PermissionTree');

module.exports = function(app) {
    const permissionTree = new PermissionTree(app.models, app.remotes())
    return permissionTree.buildDefaultTree();
}
