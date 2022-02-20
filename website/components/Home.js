import React from "react";
import CodeBlock from "./CodeBlock";

import LONGTASK_CODE from "../code/longtasks";
import PROFILER_CODE from "../code/profiler";

export default function Home() {
  return (
    <div className="Home">
      <h1>
        <a href="https://github.com/vigneshshanmugam/rum-profiler">
          rum-profiler
        </a>
      </h1>
      <p>
        How to make sense of the Long tasks data in the Real User
        Monitoring(RUM) world.
      </p>
      <h3>
        <a href="/demo" target="_blank">
          Demo
        </a>
      </h3>
      <p>
        This demo uses the Longtask API and JavaScript
        Self-Profiling API to capture the stack trace of tasks that blocks the
        UI thread for more than 50 milliseconds.
      </p>
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
        By capturing long tasks, we can identify CPU intensive tasks that are
        responsible for blocking the UI thread. But we cannot figure out the
        culprit code source location as call stack information is not available.
        Take a look at the example code below
      </p>
      <CodeBlock code={LONGTASK_CODE} />
      <p>
        From the above code, it is clear that long tasks originated from an{" "}
        <i>iframe</i> container with attributes <i>childA</i>(name) and{" "}
        <i>demo-child.html</i>(src). As a result we resorted to{" "}
        <a href="https://github.com/elastic/apm-agent-rum-js/blob/master/docs/advanced-topics.asciidoc#how-to-interpret-long-task-spans-in-the-ui">
          ideas
        </a>{" "}
        like combing the long task data along with User timing marks to reveal
        the true source code location.
      </p>
      <p>
        A while back, I was playing around with the experimental{" "}
        <a href="https://github.com/WICG/js-self-profiling/">
          JavaScript Self Profiling API
        </a>{" "}
        to print stack traces as the application was loading and also{" "}
        <a href="https://twitter.com/_vigneshh/status/1177584902637834247">
          tweeted
        </a>{" "}
        about it.
      </p>
      <p>
        By running the JavaScript sampling profiler at configured sampling
        intervals, we can collect JS profiles from end user environments and
        also map it to the long tasks to figure out the true source location.
      </p>
      <h3>How to run the profiler</h3>
      <p>
        JavaScript Self-Profiler API is available in Chrome to any page with the
        [`Document-Policy: js-profiling`](https://calendar.perfplanet.com/2021/js-self-profiling-api-in-practice/#js-self-profiling-document-policy)
        header defined.
      </p>
      <p>
        1. Paste the below snippet inside script tags in head of any enabled web page{" "}
        <br />
      </p>
      <CodeBlock code={PROFILER_CODE} />
      <p>
        2. Reload the page and check the devtools console for the link to actual
        trace.
      </p>

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
          p {
            line-height: 1.5em;
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
