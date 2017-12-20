const { expect } = require('chai');
const PermissionTree = require('../../src/PermissionTree');

describe('PermissionTree Class Test', () => {
    it('Get the default Tree', function() {
        const permissionTree = new PermissionTree(
            this.service.app.models,
            this.service.app.remotes(),
        );
        const defaultTree = permissionTree.buildDefaultTree();

        expect(defaultTree).to.be.an('array');
    });
});
