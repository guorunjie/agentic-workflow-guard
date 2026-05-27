#!/usr/bin/env node
import { run } from "../src/cli.js";

run()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
