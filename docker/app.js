'use strict';

const { metrics: getAllMetrics, cpu} = require('cgroup-metrics');

console.log("Starting...");

let previousMetrics;

async function run() {
	const metrics = await getAllMetrics();

	if (previousMetrics) {
		const cpuPercentage = cpu().calculateUsage(previousMetrics, metrics.cpuacct.usage);
		console.log(`CPU %             MEM %`);
		console.log(`${cpuPercentage.toFixed(2)}             ${metrics.memory.containerUsagePercentage.toFixed(2)}`)
	}
	previousMetrics = metrics.cpuacct.usage;

	setTimeout(run, 1000);
}

run();