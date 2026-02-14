/**
 * Smoke test: verifies build output exists and compiles.
 * Run after `npm run build`.
 */
const { existsSync } = require("fs");
const { join } = require("path");
const assert = require("assert");

const distPath = join(__dirname, "..", "dist", "server.js");
assert(existsSync(distPath), `Build output missing: ${distPath}`);

// Verify package.json has required fields
const pkg = require(join(__dirname, "..", "package.json"));
assert(pkg.main === "dist/server.js", "package.json main should point to dist/server.js");
