import React, { Component } from "react";
import FlameGraph from "../components/AutoSizedFlameGraph";

/**
 * Trying getServerProps
 */
// export function unstable_getServerProps(ctx) {
//   return {
//     props: {}
//   };
// }

export default class Trace extends Component {
  static getInitialProps({ query }) {
    return {
      flamegraphs: query.flamegraphs,
      id: query.id
    };
  }

  render() {
    const { flamegraphs, id } = this.props;

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
        <div className="App">
          <FlameGraph flamegraphs={flamegraphs} id={id} />
        </div>
      </>
    );
  }
}
