const PermissionTree = require('./src/PermissionTree');

module.exports = function(app, optionsToMerge) {
    const options = Object.assign({ mountPath: '/getUserPermissionTree' }, optionsToMerge);
    const permissionTree = new PermissionTree(app.models, app.remotes());

    app.get(options.mountPath, async(req, res) => {
        try {
            const user = await new Promise((resolve, reject) => {
                app.models.AccessToken.findForRequest(req, {}, (error, accesstoken) => {
                    if (error) return reject(error);
                    if (accesstoken === undefined) return reject(401);

                    return resolve(app.models.User.findById(accesstoken.userId));
                });
            });
            user.userGroups = await app.models.Role.getRoles({
                principalType: app.models.RoleMapping.USER,
                principalId: user.id,
            });

            const userPermissions = await permissionTree.getPermissionsForUser(user);

            res.setHeader('Content-Type', 'application/json');
            res.status(200)
                .send(userPermissions);

        } catch (error) {
            if (error === 401) {
                res.status(401);
                res.send({
                    Error: 'Unauthorized',
                    Message: 'You need to be authenticated to access this endpoint',
                });
            } else {
                res.status(500);
                res.send({
                    Error: 'Internal Server error',
                });
            }
        }
    });
};
