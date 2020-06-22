# Modules

- [`app/`](./app/): application code
- [`cli/`](./cli/): CLI & Console interface
- [`bin/`](./bin/): executable installed by package manager
- [`lib/`](./lib/): shared code





# Module structure convention

- `impl.ts`: the pure implementation, with actual running code
- `model.ts`: type definitions, to be used by `impl.ts` but also other modules
- `conf.ts`: aggregated constants & alike, for easier viewing, tweaking
- `index.ts`: the entry point, re-exporting implementation members, types, and the configuration object (only when those are present)
- `index.spec.ts`: the unit test file

If there is no real need to split the content into multiple files (e.g. code is too small), `impl.ts`, `model.ts` and `conf.ts` content can be put directly into `index.ts`.
