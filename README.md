[![Version](https://img.shields.io/npm/v/@adobe/cgroup-metrics.svg)](https://npmjs.org/package/@adobe/cgroup-metrics) [![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0) [![codecov](https://codecov.io/gh/adobe/node-cgroup-metrics/branch/master/graph/badge.svg)](https://codecov.io/gh/adobe/node-cgroup-metrics) [![Travis](https://travis-ci.com/adobe/node-cgroup-metrics.svg?branch=master)](https://travis-ci.com/adobe/node-cgroup-metrics)


### CGROUP-METRICS
Node Module for reading [cgroup v1](https://www.kernel.org/doc/Documentation/cgroup-v1/) and [cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html) metrics. Reads from `/sys/fs/cgroup/`. 

### Memory Metrics:

#### Raw values ([cgroup v1](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt)):
- `memory.stat.rss`: Resident Set Size - anonymous and swap cache memory (bytes)
- `memory.kmem.usage_in_bytes`: Kernel memory usage (bytes)
- `memory.limit_in_bytes`: Memory limit for the cgroup (bytes)

#### Raw values ([cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html#memory)):
- `memory.stat.anon`: Anonymous memory usage (bytes)
- `memory.stat`: Sum of `kernel_stack + slab + percpu + sock + vmalloc` (bytes)
- `memory.max`: Memory limit for the cgroup (bytes, or "max" for unlimited)

#### Calculated values:
- `containerUsage()`: Total memory usage (combines anonymous memory + kernel memory)
- `containerUsagePercentage()`: Memory usage as percentage of limit


### CPU Metrics:

#### Raw values ([cgroup v1](https://www.kernel.org/doc/Documentation/cgroup-v1/cpuacct.txt)):
- `cpuacct.usage`: Total CPU time consumed by all tasks (nanoseconds)
- `cpuacct.stat.user`: CPU time spent in user mode
- `cpuacct.stat.system`: CPU time spent in kernel mode

#### Raw values ([cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html#cpu)):
- `cpu.stat.usage_usec`: Total CPU time consumed by all tasks (microseconds)
- `cpu.stat.user_usec`: CPU time spent in user mode (microseconds) 
- `cpu.stat.system_usec`: CPU time spent in kernel mode (microseconds)

#### Returned CPU metrics format:
All CPU metrics include:
- `cpuNanosSinceContainerStart`: total CPU time since container start
- `timestamp`: timestamp of when the measurement was taken

#### Calculated CPU values:
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

#### File System Errors

If there is no container running or cgroup files are missing:
```
Error: Error reading file /sys/fs/cgroup/memory/memory.stat. ENOENT: no such file or directory, open '/sys/fs/cgroup/memory/memory.stat'
```

If cgroup files are empty:
```
Error: Error reading file /sys/fs/cgroup/memory/memory.stat. File is empty: /sys/fs/cgroup/memory/memory.stat.
```

#### Data Validation Errors

For malformed memory metrics:
```
Error: One or more metrics are malformed. rss: 1234, kmemUsage: NaN
```

For malformed CPU metrics:
```
Error: Error reading file /sys/fs/cgroup/cpuacct/cpuacct.stat. Malformed cpuacct.stat file: invalid CPU fields
```

#### cgroup v2 Specific Errors

For malformed cgroup v2 memory data:
```
Error: Malformed memory.stat file: invalid anon field
```

For malformed cgroup v2 CPU data:
```
Error: Malformed cpu.stat file: invalid usage_usec field
```

### Contributing

Contributions are welcomed! Read the [Contributing Guide](./CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
