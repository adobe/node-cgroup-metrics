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

/**
 * @typedef {Object} CpuMetric metrics for a specific cpu task
 * @property {Number} cpuNanosSinceContainerStart total CPU time (in nanoseconds) since the start of the container obtained by this cgroup
 * @property {Number} timestamp timestamp (in milliseconds) of when the measurement was taken
 */
/**
 * Reads metric from `/sys/fs/cgroup/cpuacct.usage`
 * @returns {CpuMetric}
 */
function usage() {
	return readandFormatMetric('cpuacct/cpuacct.usage');
}

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
function stat() {
	return readandFormatMetric('cpuacct/cpuacct.stat');
}

/**
 * Reads metrics from `/sys/fs/cgroup/cpuacct.stat`
 * @param {CpuMetric} cpuMetricFirst cpu metric object from an earlier point in time
 * @param {CpuMetric} cpuMetricSecond cpu metric object from a later point in time
 * @returns {Number} cpu usage over a period of time for a specific cpu task
 */
function calculateUsage(cpuMetricFirst, cpuMetricSecond) {
	const totalTime = (cpuMetricSecond.timestamp - cpuMetricFirst.timestamp) * 1000000;
	const deltaNS = cpuMetricSecond.cpuNanosSinceContainerStart - cpuMetricFirst.cpuNanosSinceContainerStart;
	return deltaNS / totalTime * 100
}


module.exports = {
	usage,
	stat,
	calculateUsage
}