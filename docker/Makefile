build:
	cd ..; npm pack; cp cgroup-metrics-*.tgz docker/
	docker build -t node-cgroups-test .

run:
	docker run -it node-cgroups-test

run-memory-limited:
	docker run -it -m 500000000 node-cgroups-test

build-and-run: build run
