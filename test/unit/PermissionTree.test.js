const { expect } = require('chai');
const PermissionTree = require('../../src/PermissionTree');

describe('PermissionTree Unit Test', () => {
    before('Create an instance of the PermissionTree', function() {
        this.permissionTree = new PermissionTree(
            this.service.app.models,
            this.service.app.remotes(),
        );
    });

    it('_buildDefaultTree: Should get the default Tree', function() {
        const defaultTree = this.permissionTree.getDefaultTree();

        expect(defaultTree).to.be.an('Object').with.keys(['Author', 'Book', 'Page', 'Publisher', 'User']);
    });

    it('getDefaultTree: Should get the default Tree', function() {
        const defaultTree = this.permissionTree.getDefaultTree();

        expect(defaultTree).to.be.an('Object').with.keys(['Author', 'Book', 'Page', 'Publisher', 'User']);
    });

    it('createPermissionTree: Should return an error when called without a user', async function() {
        try {
            await this.permissionTree.createPermissionTree()
        } catch (e) {
            expect(e.message).to.equals('No user was specified while trying to load permission tree!');
        }
    });

    it('getUserPermissionTree: Should return the user permission tree', function() {
        const permissionTree = this.permissionTree.getUserPermissionTree({id: 1});

        expect(permissionTree).to.be.an('Object').with.keys(['Author', 'Book', 'Page', 'Publisher', 'User']);
    });

    it('setUserPermissionTree: Should save the given value', function() {
        this.permissionTree.setUserPermissionTree(
            { id: 'setUserPermissionTreeTest' },
            { setUserPermissionTreeTest: true }
        );
        const permissionTree =  this.permissionTree.userPermissionTrees.get('setUserPermissionTreeTest');

        expect(permissionTree).to.be.an('Object').with.keys(['setUserPermissionTreeTest']);
    });

    it('setPermission: Should update with the given permissions', function() {
        this.permissionTree.setPermission(
            { id: 1 },
            {
                model: 'Author',
                property: 'create',
                accessType: 'READ',
            }
        );
        const permissionTree =  this.permissionTree.getUserPermissionTree({ id: 1 });

        expect(permissionTree.Author.create.READ).to.equals(true);
    });

});
