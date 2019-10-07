[![npm version](https://badge.fury.io/js/cgroup-metrics.svg)](https://badge.fury.io/js/cgroup-metrics)

### CGROUP-METRICS

Node Module for reading [cgroup](https://www.kernel.org/doc/Documentation/cgroup-v1/) metrics. Reads from `/sys/fs/cgroup/`. 

### Memory Metrics:

[Memory](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt) reads from path `/sys/fs/cgroup/memory/memory`:

Raw values:
- `stat.rss`: # of bytes of anonymous and swap cache memory
- `kmem.usage_in_bytes`: current kernel memory allocation
- `limit_in_bytes`: limit of memory usage

Calculated values:
- `containerUsage()`: `stats.rss` + `kmem.usage_in_bytes`
- `containerUsagePercentage()`:`stats.rss` + `kmem.usage_in_bytes` / `limit_in_bytes`

### CPU Metrics:
[CPU](https://www.kernel.org/doc/Documentation/cgroup-v1/cpuacct.txt) reads from path `/sys/fs/cgroup/`:

- `cpuacct.usage`: total CPU time (in nanoseconds) obtained by this cgroup (CPU time obtained by all the tasks)
in the system
- `cpuacct.stat`: reports the user and system CPU time consumed by all tasks in this cgroup (including tasks lower in the hierarchy):
    - `user`: CPU time (in nanoseconds) spent by tasks of the cgroup in user mode
    - `system`: CPU time (in nanoseconds) spent by tasks of the cgroup in kernel mode
- `cpuacct.usage_percpu`: CPU time (in nanoseconds) consumed on each CPU by all tasks in this cgroup (including tasks lower in the hierarchy).


### Installation

```
npm install cgroup-metrics
```

### Usage

```javascript
const cgroup = require('cgroup-metrics');

// You can access each metric separately using the async functions for each metric

// Memory Metrics
const memory = cgroup.memory();
const containerUsage = await memory.containerUsage();
console.log(containerUsage);

const containerUsagePercentage = await memory.containerUsagePercentage(containerUsage);
console.log(containerUsagePercentage);

// CPU Metrics
const cpu = cgroup.cpu();
const cpuacct_usage = await cpu.usage();
console.log(`Total CPU usage: ${cpuacct_usage}`);

const cpuacct_stats = await cpu.stat();
console.log(`CPU user count: ${cpuacct_stat.user}`);
console.log(`CPU system count: ${cpuacct_stat.system}`);

const cpuacct_usage_percpu = await cpu.usage_percpu();
console.log(`CPU usage per CPU task: ${cpuacct_usage_percpu}`);

// Or you can use the function `getAllMetrics` to get an object of all the metrics
const metrics = await cgroup.getAllMetrics();

console.log(`Container usage: ${metrics.memory.containerUsage}`);
console.log(`Container usage percentage: ${metrics.memory.containerUsagePercentage}`);

console.log(`Total CPU usage: ${metrics.cpuacct.usage}`);
console.log(`CPU user count: ${metrics.cpuacct.stat.user}`);
console.log(`CPU system count: ${metrics.cpuacct.stat.system}`);
console.log(`CPU usage per CPU task: ${metrics.cpuacct.usage_percpu}`);
```
### Error Handling

If there is no container running or there is an issue reading the file path, the function call will error

### Contributing

Contributions are welcomed! Read the [Contributing Guide](./CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
