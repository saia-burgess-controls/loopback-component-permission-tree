const { expect } = require('chai');
const PermissionTree = require('../../src/PermissionTree');

describe('PermissionTree Unit Test', () => {
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
});
