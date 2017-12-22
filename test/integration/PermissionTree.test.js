const { expect } = require('chai');
const PermissionTree = require('../../src/PermissionTree');

describe('PermissionTree Class Test', () => {
    before('Create an instance of the PermissionTree', function() {
        this.permissionTree = new PermissionTree(
            this.service.app.models,
            this.service.app.remotes(),
        );
    });

    const getPermissionTree = async(credentials) => {
        console.log('this', this);
        const tokenRequest = await this.service.api.post('/users/login', credentials);
        const accessToken = tokenRequest.body.id;

        return this.service.api.request
            .get('http://localhost:3000/getUserPermissionTree')
            .set('Authorization', accessToken);

    }

    // TODO: mode to unit test
    it('Should get the default Tree', function() {
        const defaultTree = this.permissionTree.getDefaultTree();

        expect(defaultTree).to.be.an('Object').with.keys(['Author', 'Book', 'Page', 'Publisher', 'User']);
    });


    it('Should load the current User and its roles for User:admin', async function() {
        const tokenRequest = await this.service.api.post('/users/login', {
            email: 'admin@admin.tld',
            password: 'admin',
        });
        const accessToken = tokenRequest.body.id;


        const permissions = await this.service.api.request
            .get('http://localhost:3000/getUserPermissionTree')
            .set('Authorization', accessToken);

        /*
        const permissions = await getPermissionTree({
            email: 'admin@admin.tld',
            password: 'admin',
        });
        */

        expect(permissions.body).to.be.an('Object').with.keys(['Author', 'Book', 'Page', 'Publisher', 'User']);
        expect(permissions.body.Author.find.WRITE).to.equals(true);
    });
});
