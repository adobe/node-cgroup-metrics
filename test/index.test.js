/*
Copyright 2019 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe.
*/

'use strict';

/* eslint-env mocha */
/* eslint mocha/no-mocha-arrows: "off" */

const assert = require('assert');
const mockery = require('mockery');

// mock the fs readFile function for testing
const fsMock = {
    readFileSync: function (path) {
        if (path === '/sys/fs/cgroup/memory/memory.stat') {
            return ('cache 2453\nrss 1234\n');
        }
        if (path === '/sys/fs/cgroup/memory/memory.kmem.usage_in_bytes') {
            return ('5432');
        }
        if (path === '/sys/fs/cgroup/memory/memory.limit_in_bytes') {
            return ('9999');
        }
        if (path === '/sys/fs/cgroup/cpuacct/cpuacct.usage') {
            return ('1000');
        }
        if (path === '/sys/fs/cgroup/cpuacct/cpuacct.stat') {
            return ('user 2000\nsystem 3000\n');
        }
        if (path === '/sys/fs/cgroup/cpuacct/cpuacct.usage_percpu') {
            return ('225049880 964460277 1520937451 464329645\n');
        }
        return('file path not found');
     }
};

// mock empty file
const fsMockEmptyFile = {
    readFileSync: function (path) {
        if (path === '/sys/fs/cgroup/memory/memory.stat') {
            return ('');
        }
        return('file path not found');
    }
}

// mock malformed file
const fsMockMalformedFile = {
    readFileSync: function (path) {
        if (path === '/sys/fs/cgroup/memory/memory.stat') {
            return ('cache 2453\nrss 1234\n');
        }
        if (path === '/sys/fs/cgroup/memory/memory.kmem.usage_in_bytes') {
            return ('malformed data');
        }
        if (path === '/sys/fs/cgroup/memory/memory.limit_in_bytes') {
            return ('malformed data');
        }
        return('file path not found');
    }
}

// mock malformed file
const fsMockMalformedStatFile = {
    readFileSync: function (path) {
        if (path === '/sys/fs/cgroup/memory/memory.stat') {
            return ('malformed data');
        }
        if (path === '/sys/fs/cgroup/cpuacct/cpuacct.stat') {
            return ('malformed data');
        }
        return('file path not found');
    }
}

describe('cgroup Metrics', function() {

    afterEach(() => {
        mockery.deregisterMock('fs');
        mockery.disable();
    })

    it('should return the same value as reading the mocked value in the file system', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const cgroup = require('../index');
        const memory = cgroup.memory();

        const containerUsage = await memory.containerUsage();
        assert.equal(containerUsage, 6666);

        const containerUsagePercentage = await memory.containerUsagePercentage();
        assert.equal(containerUsagePercentage, 6666/9999);
    });

    it('should return the same value as reading the mocked memory value in the file system with containerUsage', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const cgroup = require('../index');
        const memory = cgroup.memory();

        const containerUsage = await memory.containerUsage();
        assert.equal(containerUsage, 6666);

        const containerUsagePercentage = await memory.containerUsagePercentage(containerUsage);
        assert.equal(containerUsagePercentage, 6666/9999);

    });

    it('should return the same value as reading the mocked value in the file system for cpu', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const cgroup = require('../index');
        const cpu = cgroup.cpu();


        const usage = await cpu.usage();
        assert.equal(usage, 1000);

        const stat = await cpu.stat();
        assert.equal(stat.user, 2000);
        assert.equal(stat.system, 3000);

        const usage_percpu = await cpu.usage_percpu();
        assert.equal(usage_percpu[1], 964460277);
        assert.equal(usage_percpu[3], 464329645);

    });

    it('should get all metrics', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const { metrics } = require('../index');


        const metrics_object = await metrics();

        console.log(`Container usage: ${metrics_object.memory.containerUsage}`);
        console.log(`Container usage percentage: ${metrics_object.memory.containerUsagePercentage}`);

        console.log(`Total CPU usage: ${metrics_object.cpuacct.usage}`);
        console.log(`CPU user count: ${metrics_object.cpuacct.stat.user}`);
        console.log(`CPU system count: ${metrics_object.cpuacct.stat.system}`);
        console.log(`CPU usage per CPU task: ${metrics_object.cpuacct.usage_percpu}`);
        assert.equal(metrics_object.memory.containerUsage, 6666);
        assert.equal(metrics_object.memory.containerUsagePercentage, 6666/9999);
        assert.equal(metrics_object.cpuacct.stat.user, 2000);
        assert.equal(metrics_object.cpuacct.stat.system, 3000);
        assert.equal(metrics_object.cpuacct.usage_percpu[1], 964460277);
        assert.equal(metrics_object.cpuacct.usage, 1000);
    });

    it('should get all metrics and return a 1D object', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const { metrics } = require('../index');


        const metrics_object = await metrics(true);

        assert.equal(metrics_object['memory.containerUsage'], 6666);
        assert.equal(metrics_object['memory.containerUsagePercentage'], 6666/9999);
        assert.equal(metrics_object['cpuacct.stat.user'], 2000);
        assert.equal(metrics_object['cpuacct.stat.system'], 3000);
        assert.equal(metrics_object['cpuacct.usage_percpu'][1], 964460277);
        assert.equal(metrics_object['cpuacct.usage'], 1000);
    });

    // error handling check
    it('should return an error if there is no container running', async () => {
        const cgroup = require('../index');
        const memory = cgroup.memory();

        try {
            await memory.containerUsage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/memory/memory.stat, Message: ENOENT: no such file or directory, open '/sys/fs/cgroup/memory/memory.stat'")
        }
    });

    it('should fail for cpu usage if there is no container running', async () => {
        const cgroup = require('../index');
        const cpu = cgroup.cpu();

        try {
            await cpu.usage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/cpuacct/cpuacct.usage, Message: ENOENT: no such file or directory, open '/sys/fs/cgroup/cpuacct/cpuacct.usage'")
        }
    });

    it('should throw an error if the file is empty', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMockEmptyFile);

        const cgroup = require('../index');
        const memory = cgroup.memory();

        try {
            await memory.containerUsage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/memory/memory.stat, Message: File is empty")
        }
    });

    after( () => {
        mockery.deregisterAll();
    })

    it('should throw an error if the data is malformed', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMockMalformedFile);

        const cgroup = require('../index');
        const memory = cgroup.memory();

        try {
            await memory.containerUsage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "One or more metrics are malformed. rss: 1234, kmemUsage: NaN")
        }
        try {
            await memory.containerUsagePercentage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "One or more metrics are malformed. rss: 1234, kmemUsage: NaN")
        }

        try {
            await memory.containerUsagePercentage(1234);
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "One or more metrics are malformed. containerUsage: 1234, limit: NaN")
        }
    });

    it('should throw an error if the stat data is malformed', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMockMalformedStatFile);

        const cgroup = require('../index');
        const memory = cgroup.memory();
        const cpu = cgroup.cpu();


        try {
            await memory.containerUsage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/memory/memory.stat, Message: Cannot read property 'split' of undefined")
        }
        try {
            await cpu.stat();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/cpuacct/cpuacct.stat, Message: Cannot read property 'split' of undefined")
        }
    });

    after( () => {
        mockery.deregisterAll();
    })

});
