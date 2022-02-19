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

if (global.window) {
  /**
   * Profiler code
   */
  (async () => {
    if (!global.window) return;
    let t = 1,
      e = [];
    const n = new PerformanceObserver(n => {
      const s = n.getEntries();
      for (const n of s)
        e.push({
          id: `${t}`,
          name: n.name,
          type: n.entryType,
          start: Math.round(n.startTime),
          end: Math.round(n.startTime + n.duration),
          duration: Math.round(n.duration)
        }),
          t++;
    });
    n.observe({ type: "longtask", buffered: true });
    n.observe({ type: "measure", buffered: true });
    const s = new Profiler({
      sampleInterval: 10,
      maxBufferSize: Number.MAX_SAFE_INTEGER
    });
    function o(t, e) {
      return (function(t, e) {
        let { name: n, line: s, column: o, resourceId: r } = e;
        if (!n && !s && !o) return "unknown";
        n || (n = "anonymous");
        if (!s || !o) return `${n} (native code)`;
        const a = (function(t, e) {
          return t.resources[e];
        })(t, r);
        return `${n} (${a}:${s}:${o})`;
      })(
        t,
        (function(t, e) {
          return t.frames[e];
        })(t, e.frameId)
      );
    }
    function r(t, e) {
      return t.stacks[e];
    }
    function a(t, e, n = []) {
      if (!e) return n;
      const { parentId: s } = e;
      if (null != s) {
        return n.unshift(o(t, e)), a(t, r(t, s), n);
      }
      return n.unshift(o(t, e)), n;
    }
    function i(t, e) {
      return { name: t.split("$#")[0], value: e, children: [], selfTime: 0 };
    }
    setTimeout(async function() {
      n.disconnect();
      const t = (function(t) {
          const n = {};
          for (const s of t.samples) {
            const o = Math.round(s.timestamp);
            for (const a of e) {
              const { start: e, name: i, id: c, end: u, duration: l, type } = a;
              if (o >= e && o <= u) {
                n[c] ||
                  (n[c] = {
                    name: i,
                    start: e,
                    end: u,
                    type,
                    duration: l,
                    culprits: []
                  });
                const a = r(t, s.stackId);
                n[c].culprits.push({ time: o, stackId: s.stackId, stack: a });
              }
            }
          }
          return (
            (function(t, e) {
              Object.keys(t).forEach(n => {
                const { culprits: s, start: o, end: r } = t[n],
                  i = [];
                let c = o;
                for (let t = 0, n = 1; n < s.length + 1; t++, n++) {
                  let o = s[t],
                    u = s[n];
                  for (; u && u.stackId === o.stackId; )
                    n++, (o = s[++t]), (u = s[n]);
                  const l = n === s.length,
                    f = l ? o.time - c + (r - o.time) : o.time - c;
                  i.push({ totalTime: f, frames: a(e, o.stack) }), (c = o.time);
                }
                t[n].culprits = i;
              });
            })(n, t),
            n
          );
        })(await s.stop()),
        o = [];
      Object.keys(t).forEach(e => {
        const n = t[e],
          s = (function(t) {
            const e = new Map(),
              { culprits: n, name: s, duration: o, type: tp } = t,
              tg =
                tp === "longtask"
                  ? "Longtask"
                  : tp === "measure"
                  ? "User Timing"
                  : tp;
            r = i(`${tg} (${s})`, o);
            let a = null;
            const c = (t, n) => {
              e.has(t) || e.set(t, { children: [], totalTime: 0, seen: !1 });
              const s = e.get(t);
              a
                ? (s.totalTime + n <= a.totalTime && (s.totalTime += n),
                  -1 === a.children.indexOf(t) && a.children.push(t))
                : (s.totalTime += n),
                (a = s);
            };
            for (const e of n) {
              const { totalTime: n, frames: s } = e;
              if (s.length > 0) {
                a = null;
                for (let t = 0; t < s.length; t++) {
                  const e = s[t],
                    o = `${e}$#${t}`;
                  c(o, n);
                }
              } else if (a) {
                const e = `stack-unavailable$#${t.start}`;
                c(e, n);
              }
            }
            const u = (t, n, s) => {
              const o = i(t, n.totalTime);
              s.selfTime > 0
                ? (s.selfTime = s.selfTime - o.value)
                : (s.selfTime = s.value - o.value);
              const r = n.children;
              0 === r.length && (o.selfTime = o.value), s.children.push(o);
              for (const t of r) {
                const n = e.get(t);
                u(t, n, o);
              }
              n.seen = !0;
            };
            for (const [t, n] of e.entries()) n.seen || u(t, n, r);
            return r;
          })(n);
        o.push({ data: s, start: n.start, end: n.end });
      }),
        (window.PROFILED_DATA = o);
    }, 4e3);
  })();

  /**
   * Similating long tasks in the browser to get some data
   */
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
    setTimeout(function schedule() {
      makeSlowTask(randTaskLen);
      noOfTasks++;
      loop();
    }, randDelay);
  })();
}
