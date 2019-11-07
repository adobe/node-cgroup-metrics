
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
const flat = require('flat');

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
        return(parseFloat(data.trim()));
    } catch (e) {
        throw Error(`Error reading file /sys/fs/cgroup/${metric}, Message: ${e.message || e}`)
    }
}

function formatMetrics(metrics, flatten) {
    if (flatten) {
        console.log(flat(metrics));
        return flat(metrics);
    }

    return metrics;
}

module.exports = {
    readMetric,
    formatMetrics
}