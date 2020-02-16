import React from "react";
import CodeBlock from "./CodeBlock";

import LONGTASK_CODE from "../code/longtasks";

export default function Home() {
  return (
    <div className="Home">
      <h1>
        <a href="https://github.com/vigneshshanmugam/rum-profiler">
          rum-profiler
        </a>
      </h1>
      <p>
        How to make sense of the Long tasks data in the Real user
        monitoring(RUM) world.
      </p>
      <p></p>
      <h3>Motivation</h3>
      <p>
        I work on the{" "}
        <a href="https://github.com/elastic/apm-agent-rum-js">
          Elastic APM RUM agent
        </a>{" "}
        where we have recently added support for capturing long tasks from the
        end users. For those who have not heard about Long tasks, Long tasks is
        a new performance metric that can be used for measuring the
        responsiveness of an application and helps developers to understand the
        bad user experience. It enables detecting tasks that monopolize the UI
        thread for extended periods (greater than 50 milliseconds) and block
        other critical tasks from being executed as stated in the official spec.
      </p>
      <p>
        By capturing long tasks, we are able sto identify CPU intensive tasks
        that are responsible for blocking the UI thread. But we cannot figure
        out the culprit code source location as call stack information is not
        available. Take a look at the example code below
      </p>
      <CodeBlock code={LONGTASK_CODE} />
      <p>
        From the above code, its clear that long tasks originated from an
        <i>iframe</i> container with attributes <i>childA</i>(name) and{" "}
        <i>demo-child.html</i>(src).
      </p>
      <h3>
        <a href="/demo" target="_blank">
          Demo
        </a>
      </h3>
      The demo uses Longtasks API and experimental JavaScript self profiling API
      that allows developers identify hot spots in the code and collect JS
      profiles from end users.
      <style jsx global>
        {`
          body {
            margin: 0;
            font-family: sans-serif;
            background-color: #263238;
            font-weight: lighter;
            color: #fff;
          }
          a {
            color: coral;
            text-decoration: none;
          }
          .Home {
            max-width: 1024px;
            margin: auto;
          }
        `}
      </style>
    </div>
  );
}
