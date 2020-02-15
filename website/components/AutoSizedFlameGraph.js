import React, { Fragment, useRef, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FlameGraph } from "react-flame-graph";
import useSmartTooltip from "./useSmartTooltip";

function getMousePos(relativeContainer, mouseEvent) {
  if (relativeContainer !== null) {
    const rect = relativeContainer.getBoundingClientRect();
    const mouseX = mouseEvent.clientX - rect.left;
    const mouseY = mouseEvent.clientY - rect.top;

    return { mouseX, mouseY };
  } else {
    return { mouseX: 0, mouseY: 0 };
  }
}

export default function FlameGraphs({ flamegraphs, id }) {
  let displayFlamegraphs = false;
  let message = "There are no long tasks on the page";
  // trace page
  if (id && !flamegraphs) {
    message = "No Trace data available for " + id;
  } else if (flamegraphs && flamegraphs.length > 0) {
    message = "No of long tasks present on the trace: " + flamegraphs.length;
    displayFlamegraphs = true;
  }

  return (
    <>
      <h2>{message}</h2>
      {displayFlamegraphs
        ? flamegraphs.map((result, index) => (
            <AutoSizedFlameGraph
              key={index}
              result={result}
              height={300}
            ></AutoSizedFlameGraph>
          ))
        : ""}
    </>
  );
}

/**
 * Most of the code is based on the React flame graph example code
 * https://github.com/bvaughn/react-flame-graph/blob/master/website/src/
 */
export function AutoSizedFlameGraph({ result, height }) {
  const containerRef = useRef(null);
  const [tooltipState, setTooltipState] = useState(null);

  const getToolTipValue = ({ name, selfTime, value }) => {
    const fnName = name.split(" (")[0];
    const timings = `${value} ms (self ${selfTime} ms)`;
    return timings + " " + fnName;
  };

  const onMouseOver = (event, data) => {
    setTooltipState({
      text: getToolTipValue(data),
      ...getMousePos(containerRef.current, event)
    });
  };

  const onMouseMove = (event, data) => {
    setTooltipState({
      text: getToolTipValue(data),
      ...getMousePos(containerRef.current, event)
    });
  };

  const onMouseOut = () => setTooltipState(null);

  const tooltipRef = useSmartTooltip({
    mouseX: tooltipState === null ? 0 : tooltipState.mouseX,
    mouseY: tooltipState === null ? 0 : tooltipState.mouseY
  });

  return (
    <div
      style={{
        backgroundColor: "#ddb",
        boxSizing: "border-box",
        borderRadius: "0.5rem",
        margin: "20px",
        padding: "10px",
        overflow: "auto"
      }}
    >
      <h3>
        Long task starts at {result.start} ms and ends at {result.end} ms
      </h3>
      <div style={{ height, overflow: "auto" }} ref={containerRef}>
        <AutoSizer>
          {({ height: autoSizerHeight, width }) => (
            <Fragment>
              <FlameGraph
                data={result.data}
                disableDefaultTooltips={true}
                height={autoSizerHeight}
                width={width}
                onMouseMove={onMouseMove}
                onMouseOver={onMouseOver}
                onMouseOut={onMouseOut}
              />
              {tooltipState !== null && (
                <div ref={tooltipRef} className="Tooltip">
                  {tooltipState.text}
                </div>
              )}
            </Fragment>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
