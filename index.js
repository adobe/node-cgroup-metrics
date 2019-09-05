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
        containerUsage: async function() {
            const rss = await readMetric('stat');
            const kmemUsage = await readMetric('kmem.usage_in_bytes');
            if (rss !== null && kmemUsage !== null) {
                return (rss + kmemUsage);
            }
            return null
        },
        containerUsagePercentage: async function(containerUsage=false) {
            if (!(containerUsage)) {
                const rss = await readMetric('stat');
                const kmemUsage = await readMetric('kmem.usage_in_bytes');
                containerUsage = (rss !== null && kmemUsage !== null)? (rss + kmemUsage): null;
            }
            const limit = await readMetric('limit_in_bytes');
            if (containerUsage !== null && limit !== null) {
                return ((containerUsage) / limit);
            }
            return null
        } 
    }
}

/**
 * Reads metrics from `/sys/fs/cgroup/memory`
 * @param {String} metric What metric to read from `/sys/fs/cgroup/memory`
 * @returns metric value
 */
function readMetric(metric) {
    return new Promise((resolve, reject) => {
        fs.readFile(`/sys/fs/cgroup/memory/memory.${metric}`, function (err, data) {
            if (err) {
                // Error reading '/sys/fs/cgroup/memory/memory.${metric}'
                return reject(err);
            }
            else if (metric === 'stat') {
                // get rss
                const rss = data.toString().split('\n')[1].split(' ')[1];
                resolve(parseFloat(rss));   
            }
            resolve(parseFloat(data.toString()));   
        })
    }).catch(() => {
        return null;
    })
   
}

module.exports = { memory }
