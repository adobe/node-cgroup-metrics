'use strict';

const cgroups = require('cgroup-metrics');

console.log("Starting...");

let previousMetrics;

async function run() {
	const metrics = await cgroups.metrics();

	if (previousMetrics) {
		const cpuPercentage = cgroups.cpu().calculatedUsage(previousMetrics, metrics.cpuacct.usage);
		console.log(`CPU %             MEM %`);
		console.log(`${cpuPercentage.toFixed(2)}             ${metrics.memory.containerUsagePercentage.toFixed(2)}`)
	}
	previousMetrics = metrics.cpuacct.usage;

	setTimeout(run, 1000);
}

run();