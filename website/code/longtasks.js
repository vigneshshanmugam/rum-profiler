const CODE = `
const observer = new PerformanceObserver(function(list) {
  const entries = list.getEntries();
  // Example entry data looks like below
  const exampleEntry = {
    name: "same-origin-descendant",
    entryType: "longtask",
    startTime: 1023.40999995591,
    duration: 187.19000002602115,
    attribution: [
      {
        name: "unknown",
        entryType: "taskattribution",
        startTime: 0,
        duration: 0,
        containerType: "iframe",
        containerSrc: "demo-child.html",
        containerId: "",
        containerName: "childA"
      }
    ]
  };
});

observer.observe({ type: "longtask" });
`;

export default CODE;
