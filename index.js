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
async function metrics(flatten=false) {

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
        const data = fs.readFileSync(`/sys/fs/cgroup/${metric}`).toString();
        // check file is not empty
        if (data.length === 0) {
            throw Error(`File is empty`);
        }
        if (metric === 'memory/memory.stat') {
                // parse rss
                const rss = data.split('\n')[1].split(' ')[1];
                return(parseFloat(rss));
        }
        if (metric === 'cpuacct/cpuacct.stat') {
            const user = data.split('\n')[0].split(' ')[1];
            const system = data.split('\n')[1].split(' ')[1];
            return {user: user, system: system};
        }
        if (metric === 'cpuacct/cpuacct.usage_percpu') {
            return data.trim().split(' ');
        }
        return(parseFloat(data.trim()));
    } catch (e) {
        throw Error(`Error reading file /sys/fs/cgroup/${metric}, Message: ${e.message || e}`)
    }
}

module.exports = {
    memory,
    cpu,
    metrics
 }
