/*
Copyright 2022 Adobe
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
// const mockery = require('mockery');
const mockFs = require('mock-fs');
const { memory } = require('../index');

const UNLIMITED_MEMORY_AMOUNT = 9223372036854771712;

describe('cgroup memory: container memory limits', function() {
    beforeEach( () => {
        mockFs();
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('should return the same value as reading the mocked memory value in the file system with containerMemoryLimit', async () => {
        mockFs({
            '/sys/fs/cgroup': {
                'memory': {
                    'memory.stat':'cache 2453\nrss 1234\n',
                    'memory.kmem.usage_in_bytes':'5432',
                    'memory.limit_in_bytes': '9999'
                },
                'cpuacct': {
                    'cpuacct.usage': '1000',
                    'cpuacct.stat': 'user 2000\nsystem 3000\n'
                }
            }
        });

        const containerUsage =  memory.containerMemoryLimit();
        assert.equal(containerUsage, 9999);
        assert.equal(typeof containerUsage, "number");
    });

    // error handling check
    it('should return the total memory of the host if the memory limit is set to unlimited', async () => {
        mockFs({
            '/sys/fs/cgroup/memory': {
                'memory.stat':'cache 2453\nrss 1234\n',
                'memory.kmem.usage_in_bytes':'2000',
                'memory.limit_in_bytes': `${UNLIMITED_MEMORY_AMOUNT}`
            }
        });
        const osMock = require('os');
        const originalOSTotalMem = osMock.totalmem;
        osMock.totalmem = function() {
            return 80000;
        };

        const containerMemoryLimit = memory.containerMemoryLimit();
        assert.equal(containerMemoryLimit, 80000)
        osMock.totalmem = originalOSTotalMem;
    });

});
