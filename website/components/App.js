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
  let t = 1,
    n = [];
  const e = new PerformanceObserver(e => {
    const r = e.getEntries();
    for (const e of r)
      n.push({
        id: `${t}`,
        name: e.name,
        start: Math.round(e.startTime),
        end: Math.round(e.startTime + e.duration),
        duration: Math.round(e.duration)
      }),
        t++;
  });
  e.observe({ type: "longtask" });
  const r = await performance.profile({
    categories: ["js"],
    sampleInterval: 1,
    sampleBufferSize: Number.MAX_SAFE_INTEGER
  });
  async function o() {
    e.disconnect();
    const t = (function(t) {
      const e = {};
      for (const r of t.samples) {
        const o = Math.round(r.timestamp);
        for (const a of n) {
          const { start: n, name: c, id: i, end: u, duration: f } = a;
          if (o >= n && o <= u) {
            e[i] ||
              (e[i] = { name: c, start: n, end: u, duration: f, culprits: [] });
            const a = s(t, r.stackId);
            e[i].culprits.push({ time: o, stackId: r.stackId, stack: a });
          }
        }
      }
      return (
        (function(t, n) {
          Object.keys(t).forEach(e => {
            const { culprits: r, start: o, end: a } = t[e],
              s = [];
            let i = o;
            for (let t = 0, e = 1; e < r.length + 1; t++, e++) {
              let o = r[t],
                u = r[e];
              for (; u && u.stackId === o.stackId; )
                e++, (o = r[++t]), (u = r[e]);
              const f = e === r.length,
                d = f ? o.time - i + (a - o.time) : o.time - i;
              s.push({ totalTime: d, frames: c(n, o.stack) }), (i = o.time);
            }
            t[e].culprits = s;
          });
        })(e, t),
        e
      );
    })(await r.stop());
    try {
      const n = "http://localhost:8080",
        e = `${n}/flamegraph`,
        r = await fetch(e, {
          method: "POST",
          body: JSON.stringify(t),
          mode: "cors",
          redirect: "follow"
        }),
        o = `${n}/trace/${await r.text()}`;
      console.log(
        "%c Open this link in new tab to see the profiler data - " + o,
        "color: red"
      ),
        window.open(o, "_blank");
    } catch (t) {
      console.error(
        "Failed to generate flamegraphs data because of an error",
        t
      );
    }
  }
  function a(t, n) {
    return (function(t, n) {
      let { name: e, line: r, column: o, resourceId: a } = n;
      if (!e && !r && !o) return "unknown";
      e || (e = "anonymous");
      if (!r || !o) return `${e} (native code)`;
      const s = (function(t, n) {
        return t.resources[n];
      })(t, a);
      return `${e} (${s}:${r}:${o})`;
    })(
      t,
      (function(t, n) {
        return t.frames[n];
      })(t, n.frameId)
    );
  }
  function s(t, n) {
    return t.stacks[n];
  }
  function c(t, n, e = []) {
    if (!n) return e;
    const { parentId: r } = n;
    if (null != r) {
      return e.unshift(a(t, n)), c(t, s(t, r), e);
    }
    return e.unshift(a(t, n)), e;
  }
  window.addEventListener("load", () => o());
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
