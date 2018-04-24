const PermissionTree = require('./src/PermissionTree');

module.exports = function(app, optionsToMerge) {
    const options = Object.assign({ mountPath: '/getUserPermissionTree', enableCache: true }, optionsToMerge);
    const permissionTree = new PermissionTree(app.models, app.remotes(), options);

    app.get(options.mountPath, async(req, res) => {
        try {
            const user = await new Promise((resolve, reject) => {
                app.models.AccessToken.findForRequest(req, {}, (error, accesstoken) => {
                    if (error) return reject(error);
                    if (accesstoken === undefined) return reject(401);

                    return resolve(app.models.User.findById(accesstoken.userId));
                });
            });

            // The id property form mongo db gets converted to NaN when loaded
            // over the rest-connector. To prevent this the id can be explicitly
            // set to 'string' this only works if the model is public.
            // Since we can not make the extended user model public on 
            // microservices due to name conflicts this fallback is needed.
            const userId = !isNaN(user.id) ? user.id : user.userId;
            user.userGroups = await app.models.Role.getRoles({
                principalType: app.models.RoleMapping.USER,
                principalId: userId,
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
