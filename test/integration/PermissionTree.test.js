const { expect } = require('chai');

describe('PermissionTree Integration Test', () => {
    const getPermissionTree = async(service, credentials) => {
        const tokenRequest = await service.api.post('/users/login', credentials);
        const accessToken = tokenRequest.body.id;

        return service.api.request
            .get('http://localhost:3000/getUserPermissionTree')
            .set('Authorization', accessToken);
    }

    it('Should load the current User and its roles for User:admin', async function() {
        const permissions = await getPermissionTree(this.service, {
            email: 'admin@admin.tld',
            password: 'admin',
        });

        expect(permissions.body).to.be.an('Object').with.keys(['Author', 'Book', 'Page', 'Publisher', 'User']);
        expect(permissions.body.Author.find.READ).to.equals(true);
        expect(permissions.body.Author.find.WRITE).to.equals(true);
    });


    it('Should load the current User and its roles for User:reader', async function() {
        const permissions = await getPermissionTree(this.service, {
            email: 'reader@reader.tld',
            password: 'reader',
        });

        expect(permissions.body).to.be.an('Object').with.keys(['Author', 'Book', 'Page', 'Publisher', 'User']);
        expect(permissions.body.Author.find.READ).to.equals(true);
        expect(permissions.body.Author.find.WRITE).to.equals(false);
    });
});
