const path = require('path');
const Microservice = require('loopback-microservice');
const createData = require('../fixtures/createData');

before('boot microservice', async function() {
    const appRootDir = path.resolve(__dirname, '../server');
    const options = {
        appRootDir,
        bootDirs: [`${appRootDir}/boot`, 'loopback-dummy-project/boot'],
        env: 'test',
    };

    this.service = await Microservice.boot(options);
    const data = await createData(this.service.app.models);
    console.log('data', data);
});
