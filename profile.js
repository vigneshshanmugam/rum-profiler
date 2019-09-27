(async () => {
  const profiler = await performance.profile({
    categories: ["js"],
    sampleInterval: 1,
    sampleBufferSize: 2048
  });

  window.addEventListener("load", async () => {
    const trace = await profiler.stop();
    getTraces(trace);
  });

  function buildCodeFrame(trace, stack) {
    const frame = getCurrentFrame(trace, stack.frameId);
    return constructFrame(trace, frame);
  }

  function constructFrame(trace, frame) {
    let { name, line, column, resourceId } = frame;
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
      return `at ${name} (native code)`;
    }
    const resourceName = getResource(trace, resourceId);
    const message = `at ${name} (${resourceName}:${line}:${column})`;
    return message;
  }

  function getCurrentStack(trace, stackId) {
    return trace.stacks[stackId];
  }

  function getCurrentFrame(trace, frameId) {
    return trace.frames[frameId];
  }

  function buildFrames(trace, stack, frame = "") {
    const { parentId } = stack;

    if (parentId != null) {
      frame += buildCodeFrame(trace, stack);
      const nextStack = getCurrentStack(trace, parentId);
      frame += "\n";
      if (frame.split("\n").length !== 1) {
        frame += "   ";
      }
      return buildFrames(trace, nextStack, frame);
    }

    frame += buildCodeFrame(trace, stack);
    return frame;
  }

  function getResource(trace, resource) {
    return trace.resources[resource];
  }

  function getTraces(trace) {
    for (const sample of trace.samples) {
      const stack = getCurrentStack(trace, sample.stackId);
      if (!stack) {
        continue;
      }
      const time = Math.round(sample.timestamp);
      const frame = buildFrames(trace, stack);
      console.log(`Time ${time}ms`, frame);
    }
  }
})();
