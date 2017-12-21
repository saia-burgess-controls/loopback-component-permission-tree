const PermissionTree = require('./src/PermissionTree');

module.exports = function(app, optionsToMerge) {
    const options = Object.assign({ mountPath: '/getUserPermissionTree' }, optionsToMerge);
    const permissionTree = new PermissionTree(app.models, app.remotes());

    app.get(options.mountPath, (req, res) => {
        let currentUser;

        // TODO: implemet a strategy for no current user

        new Promise((resolve, reject) => {
            app.models.AccessToken.findForRequest(req, {}, (error, accesstoken) => {
                if (error) reject(error);

                console.log('accesstoken', accesstoken);

                if (accesstoken === undefined) {
                    res.status(401);
                    res.send({
                        Error: 'Unauthorized',
                        Message: 'You need to be authenticated to access this endpoint',
                    });
                }

                resolve(app.models.User.findById(accesstoken.userId));
            });
        }).then((user) => {
            currentUser = user;
            return app.models.Role.getRoles({
                principalType: app.models.RoleMapping.USER,
                principalId: currentUser.id,
            });
        }).then((roles) => {
            currentUser.userGroups = roles;
            permissionTree.setCurrentUser(currentUser);

            (async() => {
                const test = await permissionTree.createPermissionTreeForCurrentUser();
                console.log('test', test);

                res.setHeader('Content-Type', 'application/json');
                res.status(200)
                    .send(permissionTree.getDefaultTree());
            })().catch(e => console.log("Caught: " + e)); // Catches it.

        }).catch((error) => {
            res.status(500);
            res.send({
                Error: 'Internal Server error',
                Message: JSON.stringify(error),
            });
        });
    });
};
