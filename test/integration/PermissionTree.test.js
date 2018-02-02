const { expect } = require('chai');

describe('PermissionTree Integration Test', () => {
    const endPointUrl = 'http://localhost:3000/getUserPermissionTree';

    const getPermissionTree = async(service, credentials) => {
        const tokenRequest = await service.api.post('/users/login', credentials);
        const accessToken = tokenRequest.body.id;

        return service.api.request
            .get(endPointUrl)
            .set('Authorization', accessToken);
    }

    it('Should return a 401 when called witout user', async function() {
        await this.service.api.request.get(endPointUrl).catch((error) => {
            expect(error.status).to.equals(401);
        });

    });

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
