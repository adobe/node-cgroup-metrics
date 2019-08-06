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


### Installation

```
npm install cgroup-metrics
```

### Usage

```javascript
const cgroup = require('cgroup-metrics');
const memory = cgroup.memory();

// cgroup.memory() returns a promise
memory.containerUsage().then((res) => {
    console.log(res);
});
memory.containerUsagePercentage().then((res) => {
    console.log(res)
})

// Or in an async function:
async function getContainerUsage() {
    const containerUsage = await memory.containerUsage();
    console.log(containerUsage);

    const containerUsagePercentage = await memory.containerUsagePercentage();
    console.log(containerUsagePercentage);
}
getContainerUsage();
```
### Error Handling

If there is no container running or there is an issue reading the file path, the function call will return `null`

### Contributing

Contributions are welcomed! Read the [Contributing Guide](./CONTRIBUTING.md) for more information.

### Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
