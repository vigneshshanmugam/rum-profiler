import React from "react";
import { FlameGraph } from "react-flame-graph";

export default function FlameGraphContainer() {
  return (
    <div id="flamegraph-container">
      {window.PROFILED_DATA.map((result, index) => (
        <>
          <h2 key={result.start}>
            Longtask starts at {result.start} ms and ends at {result.end} ms
          </h2>
          <FlameGraph
            className="flamegraph"
            style="display:inline-bslock"
            key={result.end}
            data={result.data}
            height={200}
            width={1000}
          />
        </>
      ))}
    </div>
  );
}
