import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { init } from "@elastic/apm-rum";

const apm = init({
  serviceName: "rum-profiler",
  breakdownMetrics: true,
  logLevel: "debug"
});

// Drop APM payload
apm.addFilter(() => {});

ReactDOM.render(<App />, document.getElementById("root"));
