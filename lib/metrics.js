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

const { readMetric, formatMetrics } = require('./utils');

/**
 * Reads metrics from `/sys/fs/cgroup/memory`
 * @returns Two asyncronous functions `containerUsage` and `containerUsagePercentage`
 */
function memory() {
    return {
        containerUsage: async () => {
            const rss = await readMetric('memory/memory.stat');
            const kmemUsage = await readMetric('memory/memory.kmem.usage_in_bytes');
            if (typeof(rss) !== "number" || typeof(kmemUsage) !== "number" || (isNaN(rss)) || (isNaN(kmemUsage)) ) {
                throw Error(`One or more metrics are malformed. rss: ${rss}, kmemUsage: ${kmemUsage}`);
            }
            return (rss + kmemUsage);
        },
        containerUsagePercentage: async (containerUsage=false) => {
            if (!(containerUsage)) {
                const rss = await readMetric('memory/memory.stat');
                const kmemUsage = await readMetric('memory/memory.kmem.usage_in_bytes');
                if (typeof(rss) !== "number" || typeof(kmemUsage) !== "number" || (isNaN(rss)) || (isNaN(kmemUsage)) ) {
                    throw Error(`One or more metrics are malformed. rss: ${rss}, kmemUsage: ${kmemUsage}`);
                }
                containerUsage = (rss + kmemUsage);
            }
            const limit = await readMetric('memory/memory.limit_in_bytes');
            if (typeof(containerUsage) !== "number" || typeof(limit) !== "number" || (isNaN(containerUsage)) || (isNaN(limit)) ) {
                throw Error(`One or more metrics are malformed. containerUsage: ${containerUsage}, limit: ${limit}`);
            }
            return ((containerUsage) / limit);
        }
    }
}

/**
 * Reads metrics from `/sys/fs/cgroup/cpuacct`
 * @returns Three asyncronous functions `usage` and `stat`
 */
function cpu() {
    return {

        // returns a an object { timeSinceContainerNS: <cpuacct/cpuacct.usage>, timestamp: <timestamp>}
        usage: async () => {
            const timeSinceContainerNS = await readMetric('cpuacct/cpuacct.usage');
            return {
                timeSinceContainerNS: timeSinceContainerNS,
                timestamp: Date.now()
            }
        },

        // returns an object {user: <user-cpu-amount> , system: <system-cpu-amount>, timestamp: <timestamp>}
        stat: async () => {
            const stat = await readMetric('cpuacct/cpuacct.stat');
            return Object.assign( stat, {
                timestamp: Date.now()
            })
        },

        calculatedUsage: (usageFirst, usageSecond) => {
            const totalTime = usageSecond.timestamp - usageFirst.timestamp;
            const deltaNS = usageSecond.timeSinceContainerNS - usageFirst.timeSinceContainerNS;
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
