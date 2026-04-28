#!/usr/bin/env node
import { Command } from "commander";
import { initSprintCommand } from "./commands/init-sprint.ts";
import { previewCommand } from "./commands/preview.ts";
import { regenCommand } from "./commands/regen.ts";
import { backboneCommand } from "./commands/backbone.ts";

const program = new Command();
program.name("cadence").description("Cadence CLI").version("0.0.1");
program.addCommand(initSprintCommand());
program.addCommand(previewCommand());
program.addCommand(regenCommand());
program.addCommand(backboneCommand());
program.parseAsync().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
