[![npm version](https://badge.fury.io/js/@adobe/cgroup-metrics.svg)](https://badge.fury.io/js/@adobe/cgroup-metrics)

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

Raw CPU values:
[CPU](https://www.kernel.org/doc/Documentation/cgroup-v1/cpuacct.txt) reads from path `/sys/fs/cgroup/`:

- `cpuacct.usage`: total CPU time (in nanoseconds) since the start of the container obtained by this cgroup (CPU time obtained by all the tasks) in the system
- `cpuacct.stat`: reports the user and system CPU time consumed by all tasks in this cgroup (including tasks lower in the hierarchy)
    - `user`: CPU time (in nanoseconds) spent by tasks of the cgroup in user mode
    - `system`: CPU time (in nanoseconds) spent by tasks of the cgroup in kernel mode
    - `timestamp`: timestamp of when the measurement was taken

Both calls will return an object containing one or more `CpuMetric` objects for a specific cpu task: 
- `cpuNanosSinceContainerStart`: total CPU time (in nanoseconds) since the start of the container obtained by this cgroup in the system
- `timestamp`: timestamp of when the measurement was taken

Calculated CPU values:
- `calculateUsage`: takes two instances of calls to `cpuacct.usage` or `cpuacct.stat` and returns the calculated usage in percentage of CPU time:
    ` second time since container start - first time since container start / total time`


### Installation

```
npm install cgroup-metrics
```

### Usage

You can access each metric separately using the async functions for each metric

#### Memory Metrics
```javascript
const cgroup = require('cgroup-metrics');

const memory = cgroup.memory();
const containerUsage = await memory.containerUsage();
console.log(containerUsage);

const containerUsagePercentage = await memory.containerUsagePercentage(containerUsage);
console.log(containerUsagePercentage);
```

#### CPU Metrics
```javascript
const cpu = cgroup.cpu();

/* Returns an object like:
* {
*    cpuNanosSinceContainerStart: 120234,
*    timestamp: 153686574
* }
* */
const cpuacct_usage = await cpu.usage();
console.log(`Total CPU time since start of container (ns): ${cpuacct_usage.cpuNanosSinceContainerStart}`);


/* Returns an object like:
* {
*     user: {
*               cpuNanosSinceContainerStart: 120234,
*               timestamp: 153686574
*          },
*    system: {
*               cpuNanosSinceContainerStart: 120234,
*               timestamp: 153686574
*           },
* }
* */
const cpuacct_stats = await cpu.stat();
console.log(`CPU user count object: ${cpuacct_stat.user}`);
console.log(`CPU system count object: ${cpuacct_stat.system}`);

const calculateUsage = await cpu.calculateUsage(cpuacct_usage1, cpuacct_usage2);

```
#### All Metrics

Or you can use the function `metrics` to get an object of all the metrics:

```javascript
const metrics = await cgroup.metrics();

console.log(`Container usage: ${metrics.memory.containerUsage}`);
console.log(`Container usage percentage: ${metrics.memory.containerUsagePercentage}`);

console.log(`Total CPU time since start of container (ns): ${metrics.cpuacct.usagecpuNanosSinceContainerStart}`);
console.log(`CPU user count: ${metrics.cpuacct.stat.user}`);
console.log(`CPU system count: ${metrics.cpuacct.stat.system}`);
```
If you call `metrics` with parameter `flatten` set to `true`, it will return a flattened (1D) js object:
```javascript
const metrics = await cgroup.metrics(true);
console.log(`Memory usage in the container: ${metrics["memory.containerUsage"]}`)
```

### Error Handling

If there is no container running or there is an issue reading the file path, the function call will error something like this:
```
Error: Error reading file /sys/fs/cgroup/memory/memory.stat, Message: ENOENT: no such file or directory, open '/sys/fs/cgroup/memory/memory.stat'
```

If one of the files is empty, it will return an error like this:
```
Error: Error reading file /sys/fs/cgroup/memory/memory.stat, Message: File is empty
```

If a file is malformed, it will return an error like this:
```
Error: One or more metrics are malformed. containerUsage: 1234, limit: NaN
```
Or:
```
Error reading file /sys/fs/cgroup/cpuacct/cpuacct.stat, Message: Cannot read property 'split' of undefined
```

### Contributing

Contributions are welcomed! Read the [Contributing Guide](./CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
