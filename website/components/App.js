import React, { useState } from "react";
import FlameGraph from "./AutoSizedFlameGraph";

export default function App() {
  const [flameGraph, setFlameGraph] = useState(false);

  setTimeout(() => {
    setFlameGraph(true);
  }, 5000);

  const Loading = () => (
    <h2>Profiler started, generating flame graph data...</h2>
  );

  return (
    <div className="App">
      {flameGraph ? (
        <FlameGraph flamegraphs={window.PROFILED_DATA} />
      ) : (
        <Loading />
      )}
      <style jsx global>
        {`
          body {
            margin: 0;
            font-family: sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: #263238;
            font-weight: lighter;
          }
          h2 {
            padding: 20px;
            color: coral;
          }
          .App {
            max-width: 1200px;
            margin: auto;
          }
          .Tooltip {
            position: absolute;
            z-index: 3;
            background-color: #000;
            color: #fff;
            padding: 0.5rem;
            font-size: 13px;
          }
        `}
      </style>
    </div>
  );
}

/**
 * Profiler code
 */
(async () => {
  if (!global.window) {
    return;
  }
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

  setTimeout(stop, 4000);

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

  function createFlameGraphNode(name, value) {
    const actualName = name.split("$#")[0];
    return {
      name: actualName,
      value,
      children: [],
      selfTime: 0
    };
  }

  function getFlameGraphData(data) {
    const map = new Map();
    const { culprits, name, duration } = data;
    const rootNode = createFlameGraphNode(`Longtask (${name})`, duration);
    let currLevel = null;
    /**
     * Merge frames on all stacks together
     */
    const updateMap = (key, totalTime) => {
      if (!map.has(key)) {
        map.set(key, {
          children: [],
          totalTime: 0,
          seen: false
        });
      }
      const value = map.get(key);
      if (currLevel) {
        if (value.totalTime + totalTime <= currLevel.totalTime) {
          value.totalTime += totalTime;
        }
        if (currLevel.children.indexOf(key) === -1) {
          currLevel.children.push(key);
        }
      } else {
        value.totalTime += totalTime;
      }
      currLevel = value;
    };

    for (const culprit of culprits) {
      const { totalTime, frames } = culprit;

      if (frames.length > 0) {
        currLevel = null;
      } else {
        if (currLevel) {
          const key = `stack-unavailable$#${data.start}`;
          updateMap(key, totalTime);
        }
        continue;
      }

      for (let depth = 0; depth < frames.length; depth++) {
        const frame = frames[depth];
        const key = `${frame}$#${depth}`;
        updateMap(key, totalTime);
      }
    }

    const bfs = (currFrame, currentValue, rootNode) => {
      const node = createFlameGraphNode(currFrame, currentValue.totalTime);
      if (rootNode.selfTime > 0) {
        rootNode.selfTime = rootNode.selfTime - node.value;
      } else {
        rootNode.selfTime = rootNode.value - node.value;
      }
      const currentChildFrames = currentValue.children;
      if (currentChildFrames.length === 0) {
        node.selfTime = node.value;
      }
      rootNode.children.push(node);

      for (const frame of currentChildFrames) {
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

  function mergeStackAndCalculateTotalTime(data, trace) {
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
        const totalTime = isLast
          ? prev.time - currentStart + (end - prev.time)
          : prev.time - currentStart;

        merged.push({
          totalTime,
          frames: buildFrames(trace, prev.stack)
        });
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
        if (time >= start && time <= end) {
          if (!data[id]) {
            data[id] = {
              name,
              start,
              end,
              duration,
              culprits: []
            };
          }
          const stack = getCurrentStack(trace, sample.stackId);
          data[id].culprits.push({
            time,
            stackId: sample.stackId,
            stack
          });
        }
      }
    }
    mergeStackAndCalculateTotalTime(data, trace);
    return data;
  }
})();

/**
 * Similating long tasks in the browser to get some data
 */
if (global.window) {
  var noOfTasks = 0;
  function makeSlowTask(ms) {
    var begin = window.performance.now();
    while (window.performance.now() < begin + ms);
  }
  (function loop() {
    if (noOfTasks > 5) {
      return;
    }
    // Random number in range 100 - 400ms
    var randTaskLen = Math.round(Math.random() * (400 - 10)) + 10;
    var randDelay = Math.round(Math.random() * (1000 - 300)) + 300;
    setTimeout(function() {
      makeSlowTask(randTaskLen);
      noOfTasks++;
      loop();
    }, randDelay);
  })();
}
