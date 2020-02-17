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
    sampleInterval: 1,
    sampleBufferSize: Number.MAX_SAFE_INTEGER
  });

  async function stop() {
    po.disconnect();
    const trace = await profiler.stop();
    const traceData = getTraceData(trace);
    try {
      const serverhost = "http://localhost:8080";
      const postUrl = `${serverhost}/flamegraph`;
      const resp = await fetch(postUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(traceData),
        mode: "cors",
        redirect: "follow"
      });
      const url = await resp.text();
      const generatedLink = `${serverhost}/trace/${url}`;
      console.log(
        "%c Open this link in new tab to see the profiler data - " +
          generatedLink,
        "color: red"
      );
      window.open(generatedLink, "_blank");
    } catch (e) {
      console.error(
        "Failed to generate flamegraphs data because of an error",
        e
      );
    }
  }

  window.addEventListener("load", () => stop());

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
