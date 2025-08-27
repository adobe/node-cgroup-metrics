
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
 * Read cgroup metrics (supports both v1 and v2)
 * @param {string} metric Metric path to read (using cgroup v1 format) e.g., 'memory/memory.stat'
 * @returns {number|Object} Parsed metric value
 */
function readandFormatMetric(metric) {
    // Check whether cgroup v2 is enabled
    const isV2 = fs.existsSync('/sys/fs/cgroup/cgroup.controllers');

    // Map v1 paths to v2 paths
    let filePath = metric;
    if (isV2) {
        const pathMap = {
            'memory/memory.stat': 'memory.stat',
            'memory/memory.kmem.usage_in_bytes': 'memory.stat',
            'memory/memory.limit_in_bytes': 'memory.max',
            'cpuacct/cpuacct.usage': 'cpu.stat',
            'cpuacct/cpuacct.stat': 'cpu.stat'
        };
        filePath = pathMap[metric] || metric;
    }

    try {
        const data = fs.readFileSync(`/sys/fs/cgroup/${filePath}`).toString();
        if (data.length === 0) throw new Error(`File is empty: /sys/fs/cgroup/${filePath}.`);
        
        if (metric === 'memory/memory.stat') {
            if (isV2) {
                const stats = parseKeyValueData(data);
                if (!isValidNumber(stats.anon)) {
                    throw new Error('Malformed memory.stat file: invalid anon field');
                }
                return stats.anon;
            }
            // Handle cgroup v1
            const stats = parseKeyValueData(data);
            if (!isValidNumber(stats.rss)) {
                throw new Error('Malformed memory.stat file: invalid rss field');
            }
            return stats.rss;
        }
        
        if (metric === 'memory/memory.kmem.usage_in_bytes') {
            if (isV2) {
                const stats = parseKeyValueData(data);
                return ['kernel_stack', 'slab', 'percpu', 'sock', 'vmalloc']
                    .reduce((sum, field) => sum + (stats[field] || 0), 0);
            }
            // Handle cgroup v1
            return parseInt(data.trim(), 10);
        }
        
        if (metric === 'memory/memory.limit_in_bytes') {
            // Both v1 and v2 use same parsing
            return parseInt(data.trim(), 10);
        }

        if (metric === 'cpuacct/cpuacct.usage') {
            if (isV2) {
                const stats = parseKeyValueData(data);
                if (!isValidNumber(stats.usage_usec)) {
                    throw new Error('Malformed cpu.stat file: invalid usage_usec field');
                }
                return {
                    cpuNanosSinceContainerStart: stats.usage_usec * 1000, // μs -> ns
                    timestamp: Date.now()
                };
            }
            // Handle cgroup v1
            const timestamp = Date.now();
            return { cpuNanosSinceContainerStart: parseInt(data.trim(), 10), timestamp };
        }
        
        if (metric === 'cpuacct/cpuacct.stat') {
            if (isV2) {
                const stats = parseKeyValueData(data);
                if (!isValidNumber(stats.user_usec) || !isValidNumber(stats.system_usec)) {
                    throw new Error('Malformed cpu.stat file: invalid CPU fields');
                }
                const timestamp = Date.now();
                // Convert microseconds to USER_HZ to match v1
                // https://docs.kernel.org/admin-guide/cgroup-v1/cpuacct.html
                const USER_HZ = 100;
                const userTicks = Math.round(stats.user_usec / (1000000 / USER_HZ));
                const systemTicks = Math.round(stats.system_usec / (1000000 / USER_HZ));
                
                return {
                    user: { cpuNanosSinceContainerStart: userTicks, timestamp },
                    system: { cpuNanosSinceContainerStart: systemTicks, timestamp }
                };
            }
            // Handle cgroup v1
            const timestamp = Date.now();
            const stats = parseKeyValueData(data);
            if (!isValidNumber(stats.user) || !isValidNumber(stats.system)) {
                throw new Error('Malformed cpuacct.stat file: invalid CPU fields');
            }
            return {
                user: { cpuNanosSinceContainerStart: stats.user, timestamp },
                system: { cpuNanosSinceContainerStart: stats.system, timestamp }
            };
        }
    } catch (e) {
        throw new Error(`Error reading file /sys/fs/cgroup/${filePath}. ${e.message || e}`);
    }
}

function isValidNumber(value) {
    return typeof(value) === "number" && !isNaN(value);
}

function formatMetrics(metrics, flatten) {
    if (flatten) {
        return flat(metrics);
    }

    return metrics;
}

function parseKeyValueData(data) {
    const stats = {};
    data.split('\n').filter(line => line.trim()).forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
            const value = parseInt(parts[1], 10);
            if (!isNaN(value)) {
                stats[parts[0]] = value;
            }
        }
    });
    return stats;
}

module.exports = {
    readandFormatMetric,
    formatMetrics
};
