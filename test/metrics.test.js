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

    after( () => {
        mockery.deregisterAll();
    })

    it('should return the same value as reading the mocked value in the file system', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const memory = require('../lib/memory');

        const containerUsage =  memory.containerUsage();
        assert.equal(containerUsage, 6666);

        const containerUsagePercentage =  memory.containerUsagePercentage();
        assert.equal(containerUsagePercentage, 6666/9999 * 100);
    });

    it('should return the same value as reading the mocked memory value in the file system with containerUsage', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const memory = require('../lib/memory');

        const containerUsage =  memory.containerUsage();
        assert.equal(containerUsage, 6666);
        assert.equal(typeof containerUsage, "number");

        const containerUsagePercentage =  memory.containerUsagePercentage(containerUsage);
        assert.equal(containerUsagePercentage, 6666/9999 * 100);
        assert.equal(typeof containerUsagePercentage, "number");

    });

    it('should return the same value as reading the mocked value in the file system for cpu', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const cpu = require('../lib/cpu');


        const usage = cpu.usage();
        assert.equal(usage.cpuNanosSinceContainerStart, 1000);
        assert.equal(typeof usage, "object");
        assert.equal(typeof usage.timestamp, "number");
        assert.equal(typeof usage.cpuNanosSinceContainerStart, "number");

        const stat = cpu.stat();

        assert.equal(typeof stat.system, "object");
        assert.equal(typeof stat.user, "object");
        assert.equal(stat.user.cpuNanosSinceContainerStart, 2000);
        assert.equal(stat.system.cpuNanosSinceContainerStart, 3000);
        assert.equal(typeof stat.system.cpuNanosSinceContainerStart, "number");
        assert.equal(typeof stat.user.cpuNanosSinceContainerStart, "number");
        assert.equal(typeof stat.user.timestamp, "number");
        assert.equal(typeof stat.system.timestamp, "number");

    });

    it('should calculate cpu usage over a period of time', async () => {
        const cpu = require('../lib/cpu');
        const cpuUsage1 = {
            cpuNanosSinceContainerStart: 400000029,
            timestamp: 100000
        }
        const cpuUsage2 = {
            cpuNanosSinceContainerStart: 430000029,
            timestamp: 102000
        }

        const calculateUsage = cpu.calculateUsage(cpuUsage1, cpuUsage2);
        assert.equal(calculateUsage, 1.5);

    });

    it('should get all metrics', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const { metrics } = require('../index');


        const metrics_object = metrics();

        console.log(`Container usage: ${metrics_object.memory.containerUsage}`);
        console.log(`Container usage percentage: ${metrics_object.memory.containerUsagePercentage}`);

        console.log(`Total CPU usage: ${metrics_object.cpuacct.usage}`);
        console.log(`CPU user count: ${metrics_object.cpuacct.stat.user}`);
        console.log(`CPU system count: ${metrics_object.cpuacct.stat.system}`);
        assert.equal(metrics_object.memory.containerUsage, 6666);
        assert.equal(metrics_object.memory.containerUsagePercentage, 6666/9999 * 100);
        assert.equal(metrics_object.cpuacct.stat.user.cpuNanosSinceContainerStart, 2000);
        assert.equal(metrics_object.cpuacct.stat.system.cpuNanosSinceContainerStart, 3000);
        assert.equal(metrics_object.cpuacct.usage.cpuNanosSinceContainerStart, 1000);
    });

    it('should get all metrics and return a 1D object', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMock);
        const { metrics } = require('../index');


        const metrics_object1D = metrics(true);

        assert.equal(metrics_object1D['memory.containerUsage'], 6666);
        assert.equal(metrics_object1D['memory.containerUsagePercentage'], 6666/9999 * 100);
        assert.equal(metrics_object1D['cpuacct.stat.user.cpuNanosSinceContainerStart'], 2000);
        assert.equal(metrics_object1D['cpuacct.stat.system.cpuNanosSinceContainerStart'], 3000);
        assert.equal(metrics_object1D['cpuacct.usage.cpuNanosSinceContainerStart'], 1000);
        assert.equal(typeof metrics_object1D['cpuacct.stat.user.timestamp'], "number");
        assert.equal(typeof metrics_object1D['cpuacct.stat.system.timestamp'], "number");
        assert.equal(typeof metrics_object1D['cpuacct.usage.timestamp'], "number");
    });

    // error handling check
    it('should return an error if there is no container running', async () => {
        const memory = require('../lib/memory');

        try {
            memory.containerUsage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/memory/memory.stat, Message: ENOENT: no such file or directory, open '/sys/fs/cgroup/memory/memory.stat'")
        }
    });

    it('should fail for cpu usage if there is no container running', async () => {
        const cpu = require('../lib/cpu');

        try {
            cpu.usage();
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

        const memory = require('../lib/memory');

        try {
            memory.containerUsage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/memory/memory.stat, Message: File is empty")
        }
    });

    it('should throw an error if the data is malformed', async () => {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache:true
        });
        mockery.registerMock('fs', fsMockMalformedFile);

        const memory = require('../lib/memory');

        try {
            memory.containerUsage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "One or more metrics are malformed. rss: 1234, kmemUsage: NaN")
        }
        try {
            memory.containerUsagePercentage();
            assert.fail('failure expected');
        } catch (e) {
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "One or more metrics are malformed. rss: 1234, kmemUsage: NaN")
        }

        try {
            memory.containerUsagePercentage(1234);
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

        const {memory, cpu} = require('../index');

        let threw = false;

        try {
            memory.containerUsage();
            assert.fail('failure expected');
        } catch (e) {
            threw = true;
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/memory/memory.stat, Message: Cannot read property 'split' of undefined")
        }

        assert.ok(threw);
        threw = false;

        try {
             cpu.stat();
            assert.fail('failure expected');
        } catch (e) {
            threw = true;
            console.log(`test expected to fail: ${e}`)
            assert.equal(e.message, "Error reading file /sys/fs/cgroup/cpuacct/cpuacct.stat, Message: Cannot read property 'split' of undefined")
        }
        assert.ok(threw);
    });

});
