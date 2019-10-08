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
const fs = require('fs');

/**
 * Reads metrics from `/sys/fs/cgroup/memory`
 * @returns Two asyncronous functions `containerUsage` and `containerUsagePercentage`
 */
function memory() {
    return {
        containerUsage: async () => {
            const rss = await readMetric('memory/memory.stat');
            const kmemUsage = await readMetric('memory/memory.kmem.usage_in_bytes');
            if (rss !== null && kmemUsage !== null) {
                return (rss + kmemUsage);
            }
            return null
        },
        containerUsagePercentage: async (containerUsage=false) => {
            if (!(containerUsage)) {
                const rss = await readMetric('memory/memory.stat');
                const kmemUsage = await readMetric('memory/memory.kmem.usage_in_bytes');
                containerUsage = (rss !== null && kmemUsage !== null)? (rss + kmemUsage): null;
            }
            const limit = await readMetric('memory/memory.limit_in_bytes');
            if (containerUsage !== null && limit !== null) {
                return ((containerUsage) / limit);
            }
            return null
        }
    }
}

/**
 * Reads metrics from `/sys/fs/cgroup/cpuacct`
 * @returns Three asyncronous functions `usage`, `stat`, and `usage_percpu`
 */
function cpu() {
    return {

        // returns a value
        usage: async () => {
            return readMetric('cpuacct/cpuacct.usage');
        },

        // returns an object {user: <user-cpu-amount> , system: <system-cpu-amount>}
        stat: async () => {
            const stat = await readMetric('cpuacct/cpuacct.stat');
            return stat
        },

        // returns a list of cpu usages by task
        usage_percpu: async () => {
            return readMetric('cpuacct/cpuacct.usage_percpu');
        }

    }
}

/**
 * Calls cpu() and memory() functions to get all metrics at once
 * @param {Boolean} flatten if true, it returns a on dimensional object
 * @returns {Object} map of each metric to its result
 */
async function getAllMetrics(flatten=false) {

    const memory_container_usage = await memory().containerUsage();
    const memory_container_usage_perc = await memory().containerUsagePercentage(memory_container_usage);

    const cpuacct_usage = await cpu().usage();
    const cpuacct_stat = await cpu().stat();
    const cpuacct_usage_percpu = await cpu().usage_percpu();

    if (flatten) {
        return {
            "memory.containerUsage": memory_container_usage,
            "memory.containerUsagePercentage": memory_container_usage_perc,
            "cpuacct.usage": cpuacct_usage,
            "cpuacct.stat.user": cpuacct_stat.user,
            "cpuacct.stat.system": cpuacct_stat.system,
            "cpuacct.usage_percpu": cpuacct_usage_percpu
        }
    }

    return {
        memory: {
            containerUsage: memory_container_usage,
            containerUsagePercentage: memory_container_usage_perc,
        },
        cpuacct: {
            usage: cpuacct_usage,
            stat: cpuacct_stat,
            usage_percpu: cpuacct_usage_percpu
        }
    }
}


/**
 * Reads metrics from `/sys/fs/cgroup/`
 * @param {String} metric What metric to read from `/sys/fs/cgroup/`
 * @returns metric value
 */
async function readMetric(metric) {
    try {
        const data = fs.readFileSync(`/sys/fs/cgroup/${metric}`)
        if (metric === 'memory/memory.stat') {
                // get rss
                const rss = data.toString().split('\n')[1].split(' ')[1];
                return(parseFloat(rss));
        }
        if (metric === 'cpuacct/cpuacct.stat') {
            const user = data.toString().split('\n')[0].split(' ')[1];
            const system = data.toString().split('\n')[1].split(' ')[1];
            return {user: user, system: system};
        }
        if (metric === 'cpuacct/cpuacct.usage_percpu') {
            return data.toString().trim().split(' ');
        }
        return(parseFloat(data.toString()));
    } catch (e) {
        throw Error(`Error reading file /sys/fs/cgroup/${metric}, Message: ${e.message || e}`)
    }
}

module.exports = {
    memory,
    cpu,
    getAllMetrics
 }
