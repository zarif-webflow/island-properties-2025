// bin/live-reload.js
new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());
//# sourceMappingURL=chunk-YHPSZOHO.js.map
