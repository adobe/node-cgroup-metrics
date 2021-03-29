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

const { formatMetrics } = require('./utils');
const cpu = require('./cpu');
const memory = require('./memory');

/**
 * Calls cpu() and memory() functions to get all metrics at once
 * @param {Boolean} flatten if true, it returns a on dimensional object
 * @returns {Object} map of each metric to its result
 */
function metrics(flatten=false) {
    const metricsObj = {
        memory:{},
        cpuacct:{}
    };
	
    metricsObj.memory.containerUsage           = memory.containerUsage();
    metricsObj.memory.containerUsagePercentage = memory.containerUsagePercentage(metricsObj.memory.containerUsage);

    metricsObj.cpuacct.usage = cpu.usage();
    metricsObj.cpuacct.stat  = cpu.stat();

    return formatMetrics(metricsObj, flatten);
}

module.exports = {
    metrics
};
