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

const { readandFormatMetric, formatMetrics } = require('./utils');
const os = require('os');

/**
 * Reads metrics from `/sys/fs/cgroup/memory`
 * @returns Two asyncronous functions `containerUsage` and `containerUsagePercentage`
 */
function memory() {
    return {
        containerUsage: async () => {
            const rss = await readandFormatMetric('memory/memory.stat');
            const kmemUsage = await readandFormatMetric('memory/memory.kmem.usage_in_bytes');
            if (typeof(rss) !== "number" || typeof(kmemUsage) !== "number" || (isNaN(rss)) || (isNaN(kmemUsage)) ) {
                throw Error(`One or more metrics are malformed. rss: ${rss}, kmemUsage: ${kmemUsage}`);
            }
            return (rss + kmemUsage);
        },
        containerUsagePercentage: async (containerUsage=false) => {
            if (!(containerUsage)) {
                const rss = await readandFormatMetric('memory/memory.stat');
                const kmemUsage = await readandFormatMetric('memory/memory.kmem.usage_in_bytes');
                if (typeof(rss) !== "number" || typeof(kmemUsage) !== "number" || (isNaN(rss)) || (isNaN(kmemUsage)) ) {
                    throw Error(`One or more metrics are malformed. rss: ${rss}, kmemUsage: ${kmemUsage}`);
                }
                containerUsage = (rss + kmemUsage);
            }
            let limit = await readandFormatMetric('memory/memory.limit_in_bytes');
            if (typeof(containerUsage) !== "number" || typeof(limit) !== "number" || (isNaN(containerUsage)) || (isNaN(limit)) ) {
                throw Error(`One or more metrics are malformed. containerUsage: ${containerUsage}, limit: ${limit}`);
            }
            // if it's set to unlimited, return the total memory of the host
            if (limit >= 9223372036854771712) {
                limit = os.totalmem();
            }
            console.log(`MEM USAGE / LIMIT: ${containerUsage} / ${limit}`);
            return (containerUsage / limit) * 100;
        }
    }
}
/**
 * @typedef {Object} CpuMetric metrics for a specific cpu task
 * @property {Number} cpuNanosSinceContainerStart total CPU time (in nanoseconds) since the start of the container obtained by this cgroup
 * @property {Number} timestamp timestamp (in milliseconds) of when the measurement was taken
 */
/**
 * Reads metrics from `/sys/fs/cgroup/cpuacct`
 * @returns Three asyncronous functions `usage`, `stat`, and `calculatedUsage`
 */
function cpu() {
    return {

        /**
         * Reads metric from `/sys/fs/cgroup/cpuacct.usage`
         * @returns {CpuMetric}
         */
        usage: async () => {
            return readandFormatMetric('cpuacct/cpuacct.usage');
        },

        /**
         * Reads metrics from `/sys/fs/cgroup/cpuacct.stat`
         * @returns {Object} two CpuMetric objects `user` and `system`
         *
         * example structure: {
         *                      user: {
         *                              cpuNanosSinceContainerStart: 120234,
         *                              timestamp: 153686574
         *                             },
         *                      system: {
         *                              cpuNanosSinceContainerStart: 120234,
         *                              timestamp: 153686574
         *                             },
         *                     }
         */
        stat: async () => {
            return readandFormatMetric('cpuacct/cpuacct.stat');
        },

        /**
         * Reads metrics from `/sys/fs/cgroup/cpuacct.stat`
         * @param {CpuMetric} cpuMetricFirst cpu metric object from an earlier point in time
         * @param {CpuMetric} cpuMetricSecond cpu metric object from a later point in time
         * @returns {Number} cpu usage over a period of time for a specific cpu task
         */
        calculatedUsage: (cpuMetricFirst, cpuMetricSecond) => {
            const totalTime = (cpuMetricSecond.timestamp - cpuMetricFirst.timestamp) * 1000000;
            const deltaNS = cpuMetricSecond.cpuNanosSinceContainerStart - cpuMetricFirst.cpuNanosSinceContainerStart;
            return deltaNS / totalTime * 100
        }

    }
}

/**
 * Calls cpu() and memory() functions to get all metrics at once
 * @param {Boolean} flatten if true, it returns a on dimensional object
 * @returns {Object} map of each metric to its result
 */
async function metrics(flatten=false) {

    const metricsObj = {
        memory:{},
        cpuacct:{}
    }
    metricsObj.memory.containerUsage           = await memory().containerUsage();
    metricsObj.memory.containerUsagePercentage = await memory().containerUsagePercentage(metricsObj.memory.containerUsage);

    metricsObj.cpuacct.usage = await cpu().usage();
    metricsObj.cpuacct.stat  = await cpu().stat();

	return formatMetrics(metricsObj, flatten);
}



module.exports = {
    memory,
    cpu,
    metrics
 }
