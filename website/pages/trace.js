import React, { Component } from "react";
import FlameGraph from "../components/AutoSizedFlameGraph";

// export function getServerProps(ctx) {
//   return {
//     props: {}
//   };
// }

export default class Trace extends Component {
  static getInitialProps({ query }) {
    return {
      flamegraphs: query.flamegraphs
    };
  }

  render() {
    const flamegraphs = this.props.flamegraphs;
    const Fallback = () => <h2>No Trace data available</h2>;

    return (
      <>
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
              color: "#fff";
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
        <div className="App">
          {flamegraphs.length === 0 ? (
            <Fallback />
          ) : (
            <FlameGraph flamegraphs={flamegraphs} />
          )}
        </div>
      </>
    );
  }
}
