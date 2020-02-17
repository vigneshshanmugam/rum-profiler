const LRU = require("lru-cache");

/**
 * Demo flamegraphs
 * Lives till server's lifetime
 */
const NEVER_DELETE = ["zalando", "elastic", "kibana"];

const cache = new LRU({
  max: 100,
  maxAge: 3 * 60 * 60 * 1000, // 3 hours
  noDisposeOnSet: true,
  dispose: (key, value) => {
    if (NEVER_DELETE.indexOf(key) >= 0) {
      process.nextTick(() => cache.set(key, value));
    }
  }
});

function createFlameGraphNode(name, value) {
  const actualName = name.split("$#")[0];
  return {
    name: actualName,
    value,
    children: [],
    selfTime: 0
  };
}

function generateFlameGraph(trace) {
  const flamegraphs = [];
  Object.keys(trace).forEach(key => {
    const data = trace[key];
    const flamegraph = getFlameGraphData(data);
    flamegraphs.push({
      data: flamegraph,
      start: data.start,
      end: data.end
    });
  });
  return flamegraphs;
}

function getFlameGraphData(data) {
  const map = new Map();
  const { culprits, name, type, duration } = data;
  let taskName = type;
  if (type === "longtask") {
    taskName = "Longtask";
  } else if (type === "measure") {
    taskName = "User Timing";
  }
  const rootNode = createFlameGraphNode(`${taskName} (${name})`, duration);
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

function storeTrace(trace, cacheKey) {
  if (!cacheKey) {
    const hrTime = process.hrtime();
    cacheKey = hrTime[0] * 1e9 + hrTime[1]; //  nanoseconds
  }
  const flameGraph = generateFlameGraph(trace);
  cache.set(`${cacheKey}`, flameGraph);
  return cacheKey;
}

function getTrace(cacheKey) {
  if (cacheKey) {
    return cache.get(cacheKey);
  }
  return null;
}

module.exports = { storeTrace, getTrace };
