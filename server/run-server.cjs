/**
 * Start the server without using npm scripts (avoids "spawn sh" ENOENT).
 * From the server directory run: node run-server.cjs
 */
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const cwd = __dirname;

// Build with TypeScript compiler API (no tsc.js path needed)
console.log("Building...");
let ts;
try {
  ts = require("typescript");
} catch (e) {
  console.error("TypeScript not found. Run: npm install");
  process.exit(1);
}

const configPath = path.join(cwd, "tsconfig.json");
const configFile = ts.readConfigFile(configPath, (p) => fs.readFileSync(p, "utf8"));
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const result = program.emit();
if (result.diagnostics && result.diagnostics.length) {
  const format = (d) => ts.formatDiagnostic(d, { getCanonicalFileName: (f) => f, getCurrentDirectory: () => cwd });
  result.diagnostics.forEach((d) => console.error(format(d)));
  if (result.diagnostics.some((d) => d.category === ts.DiagnosticCategory.Error)) {
    process.exit(1);
  }
}

console.log("Starting server...");
const serverPath = path.join(cwd, "dist", "server.js");
if (!fs.existsSync(serverPath)) {
  console.error("dist/server.js not found after build.");
  process.exit(1);
}
const server = spawnSync(process.execPath, [serverPath], { cwd, stdio: "inherit", shell: false });
process.exit(server.status ?? 0);
