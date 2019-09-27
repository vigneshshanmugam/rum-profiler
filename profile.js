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
    const { name, line, column, resourceId } = frame;
    if (!line || !column) {
      return name;
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
    const { frameId, parentId } = stack;

    if (parentId != null) {
      frame += buildCodeFrame(trace, stack);
      const nextStack = getCurrentStack(trace, parentId);
      if (frame.split("/n").length === 1) {
        frame += "\n" + "   ";
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
      console.info(`${time} ms`, frame);
    }
  }
})();
