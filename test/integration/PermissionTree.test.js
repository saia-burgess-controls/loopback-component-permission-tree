const { expect } = require('chai');
const PermissionTree = require('../../src/PermissionTree');

describe('PermissionTree Class Test', () => {
    before('Create an instance of the PermissionTree', function() {
        this.permissionTree = new PermissionTree(
            this.service.app.models,
            this.service.app.remotes(),
        );
    });

    it('Should get the default Tree', function() {
        const defaultTree = this.permissionTree.getDefaultTree();

        expect(defaultTree).to.be.an('Object').with.keys(['Author', 'Book', 'Page', 'Publisher', 'User']);
    });


    it('Should load the current User and its roles', async function() {
        const tokenRequest = await this.service.api.post('/users/login', {
            email: 'admin@admin.tld',
            password: 'admin',
        });
        const accessToken = tokenRequest.body.id;

        try {

        const foo = await this.service.api.request
            .get('http://localhost:3000/getUserPermissionTree')
            .set('Authorization', accessToken);

            console.log('fin');

        } catch (e) {
            console.log('e', e);
        }


    });
});
