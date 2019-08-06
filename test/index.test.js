/*
Copyright 2019 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe. 
*/

const expect = require('expect.js');
const mockery = require('mockery');

// mock the fs readFile function for testing
const fsMock = {
    readFile: function (path, cb) { 
        if (path === '/sys/fs/cgroup/memory/memory.stat') {
            return (cb(null, 'cache 2453\nrss 1234\n'));
        }
        if (path === '/sys/fs/cgroup/memory/memory.kmem.usage_in_bytes') {
            return (cb(null,'5432'));
        }
        if (path === '/sys/fs/cgroup/memory/memory.limit_in_bytes') {
            return (cb(null,'9999'));
        }
        return(cb('file path not found', null));
     }
};


describe('cgroup Metrics', function() {
    afterEach(() => {
        mockery.deregisterMock(fsMock);
        mockery.disable();
    })
    it('should return the same value as reading the file system', function() {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const cgroup = require('../index');
        const memory = cgroup.memory();
        
        // using async funtion
        async function getContainerUsage() {
            const containerUsage = await memory.containerUsage();
            expect(containerUsage).to.be(6666);
            
            const containerUsagePercentage = await memory.containerUsagePercentage(); 
            expect(containerUsagePercentage).to.be(6666/9999);
        }
        getContainerUsage();
        
        // using promises
        memory.containerUsage().then((res) => {
            expect(res).to.be(6666);
        })
    });

    it('should return null if there is no container running', function() {
        const cgroup = require('../index');
        const memory = cgroup.memory();
        
        // using promises
        memory.containerUsage().then((res) => {
            expect(res).to.be(null);
        });
        memory.containerUsagePercentage().then((res) => {
            expect(res).to.be(null);
        });
    });

});
