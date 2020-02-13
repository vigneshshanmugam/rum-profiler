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

export default function FlameGraphs() {
  const list = window.PROFILED_DATA;

  const graphs = list.map((result, index) => (
    <AutoSizedFlameGraph
      key={index}
      result={result}
      height={300}
    ></AutoSizedFlameGraph>
  ));
  return graphs;
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

  const onMouseOut = (event, data) => {
    setTooltipState(null);
  };

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
      ref={containerRef}
    >
      <h3>
        Long task starts at {result.start} ms and ends at {result.end} ms
      </h3>
      <div style={{ height, overflow: "auto" }}>
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
                <div ref={tooltipRef} className="tooltip">
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
