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

const { readandFormatMetric } = require('./utils');
const os = require('os');

const UNLIMITED_MEMORY_AMOUNT = 9223372036854771712;

/**
 * Reads metrics from `/sys/fs/cgroup/memory/memory.stat` and `/sys/fs/cgroup/memory/memory.kmem.usage_in_bytes`
 * @returns {Number} container usage based on rss and kmemUsage stats (bytes)
 */
function containerUsage() {
	const rss = readandFormatMetric('memory/memory.stat');
	const kmemUsage = readandFormatMetric('memory/memory.kmem.usage_in_bytes');
	if (typeof(rss) !== "number" || typeof(kmemUsage) !== "number" || (isNaN(rss)) || (isNaN(kmemUsage)) ) {
		throw Error(`One or more metrics are malformed. rss: ${rss}, kmemUsage: ${kmemUsage}`);
	}
	return (rss + kmemUsage);
}

/**
 * Reads metrics from `/sys/fs/cgroup/memory`
 * @returns {Number} container usage divided by memory limit of the container
 */
function containerUsagePercentage(memoryContainerUsage=false){
	if (!(memoryContainerUsage)) {
		memoryContainerUsage = containerUsage();
	}
	const limit = containerMemoryLimit(memoryContainerUsage);
	return (memoryContainerUsage / limit) * 100;
}

/**
 * Reads metrics from `/sys/fs/cgroup/memory`
 * @returns {Number} container memory limit (bytes)
 */
function containerMemoryLimit(memoryContainerUsage=false){
	if (!(memoryContainerUsage)) {
		memoryContainerUsage = containerUsage();
	}

	let limit = readandFormatMetric('memory/memory.limit_in_bytes');
	if (typeof(limit) !== "number" || (isNaN(limit)) ) {
		throw Error(`Memory limit metric is malformed: limit: ${limit}`);
	}
	// if it's set to unlimited, return the total memory of the host
	if (limit >= UNLIMITED_MEMORY_AMOUNT || limit === 0) {
		limit = os.totalmem();
	}
	return limit;
}

module.exports = {
	containerUsage,
	containerUsagePercentage,
    containerMemoryLimit
}
