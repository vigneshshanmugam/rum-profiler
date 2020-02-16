import React from "react";
import CodeMirror from "react-codemirror";

if (global.window) {
  require("codemirror/mode/javascript/javascript");
}

const CodeBlock = ({ code }) => {
  return (
    <>
      <CodeMirror
        className="CodeMirror cm-s-material"
        value={code}
        options={{
          mode: "javascript",
          readOnly: true
        }}
      />
      <style jsx global>{`
        .CodeMirror {
          background: #263238;
          color: #eeffff;
          height: auto;
          font-size: 14px;
        }
      `}</style>
    </>
  );
};

export default CodeBlock;
