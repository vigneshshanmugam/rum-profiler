(async () => {
  let i = 1;
  let longtaskSpans = [];
  const po = new PerformanceObserver(list => {
    const entries = list.getEntries();
    for (const entry of entries) {
      longtaskSpans.push({
        id: `${i}`,
        name: entry.name,
        start: Math.round(entry.startTime),
        end: Math.round(entry.startTime + entry.duration),
        duration: Math.round(entry.duration)
      });
      i++;
    }
  });

  po.observe({
    type: "longtask"
  });

  const profiler = await performance.profile({
    categories: ["js"],
    sampleInterval: 10,
    sampleBufferSize: Number.MAX_SAFE_INTEGER
  });

  async function stop() {
    po.disconnect();
    const trace = await profiler.stop();
    const traceData = getTraceData(trace);
    const PROFILED_DATA = [];
    Object.keys(traceData).forEach(key => {
      const data = traceData[key];
      const flamegraph = getFlameGraphData(data);
      PROFILED_DATA.push({
        data: flamegraph,
        start: data.start,
        end: data.end
      });
    });
    window.PROFILED_DATA = PROFILED_DATA;
  }

  setTimeout(stop, 3000);

  function buildCodeFrame(trace, stack) {
    const frame = getCurrentFrame(trace, stack.frameId);
    return constructFrame(trace, frame);
  }

  function constructFrame(trace, frame) {
    let { name, line, column, resourceId } = frame;
    if (!name && !line && !column) {
      return `unknown`;
    }
    /**
     * anonymous functions
     */
    if (!name) {
      name = "anonymous";
    }
    /**
     * Native code
     */
    if (!line || !column) {
      return `${name} (native code)`;
    }
    const resourceName = getResource(trace, resourceId);
    const message = `${name} (${resourceName}:${line}:${column})`;
    return message;
  }

  function getCurrentStack(trace, stackId) {
    return trace.stacks[stackId];
  }

  function getCurrentFrame(trace, frameId) {
    return trace.frames[frameId];
  }

  function buildFrames(trace, stack, frames = []) {
    if (!stack) {
      return frames;
    }
    const { parentId } = stack;

    if (parentId != null) {
      frames.unshift(buildCodeFrame(trace, stack));
      const nextStack = getCurrentStack(trace, parentId);
      return buildFrames(trace, nextStack, frames);
    }

    frames.unshift(buildCodeFrame(trace, stack));
    return frames;
  }

  function getResource(trace, resource) {
    return trace.resources[resource];
  }

  function createNode(name, value) {
    const actualName = name.split("$#")[0];
    return {
      name: actualName,
      value,
      children: []
    };
  }

  function getFlameGraphData(data) {
    const map = new Map();
    const { culprits, name, duration } = data;
    const rootNode = createNode(`Longtask (${name})`, duration);
    let currLevel = null;
    /**
     * Merge frames on all stacks together
     */
    for (const culprit of culprits) {
      const { selfTime, frames } = culprit;
      if (frames.length === 0) {
        continue;
      }
      for (let depth = 0; depth < frames.length; depth++) {
        const frame = frames[depth];
        const key = `${frame}$#${depth}`;
        if (!map.has(key)) {
          map.set(key, {
            children: [],
            selfTime: 0,
            seen: false
          });
        }
        const value = map.get(key);
        if (currLevel) {
          if (value.selfTime + selfTime <= currLevel.selfTime) {
            value.selfTime += selfTime;
          }
          if (currLevel.children.indexOf(key) === -1) {
            currLevel.children.push(key);
          }
        } else {
          value.selfTime += selfTime;
        }
        currLevel = value;
      }
      currLevel = null;
    }

    const bfs = (currFrame, currentValue, rootNode) => {
      const node = createNode(currFrame, currentValue.selfTime);
      rootNode.children.push(node);
      for (const frame of currentValue.children) {
        const nodeValue = map.get(frame);
        bfs(frame, nodeValue, node);
      }
      currentValue.seen = true;
    };

    /**
     * Combine the frames in to flamegraph chart data
     */
    for (const [key, value] of map.entries()) {
      if (value.seen) {
        continue;
      }
      bfs(key, value, rootNode);
    }
    return rootNode;
  }

  function mergeStackAndCalculateSelfTime(data, trace) {
    Object.keys(data).forEach(key => {
      const { culprits, start, end } = data[key];
      const merged = [];
      let currentStart = start;
      for (let i = 0, j = 1; j < culprits.length + 1; i++, j++) {
        let prev = culprits[i];
        let current = culprits[j];
        while (current && current.stackId === prev.stackId) {
          j++;
          i++;
          prev = culprits[i];
          current = culprits[j];
        }
        const isLast = j === culprits.length;
        const selfTime = isLast
          ? prev.time - currentStart + (end - prev.time)
          : prev.time - currentStart;

        merged.push({
          selfTime,
          frames: buildFrames(trace, prev.stack)
        });
        ``;
        currentStart = prev.time;
      }
      data[key].culprits = merged;
    });
  }

  function getTraceData(trace) {
    const data = {};
    for (const sample of trace.samples) {
      const time = Math.round(sample.timestamp);
      for (const longtask of longtaskSpans) {
        const { start, name, id, end, duration } = longtask;
        if (!data[id]) {
          data[id] = {
            name,
            start,
            end,
            duration,
            culprits: []
          };
        }

        if (time >= start && time <= end) {
          const stack = getCurrentStack(trace, sample.stackId);
          data[id].culprits.push({
            time,
            stackId: sample.stackId,
            stack
          });
        }
      }
    }
    mergeStackAndCalculateSelfTime(data, trace);
    return data;
  }
})();
