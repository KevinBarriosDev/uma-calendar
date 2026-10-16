# Uma Calendar

Career race calendar for *Umamusume: Pretty Derby* (Global server), laid out like the game: three years, every month split into Early and Late. Tap a turn to see its races and which Umas have an objective there.

## Development

Requires Node 22.22+.

    npm install
    npm run dev        # http://localhost:4321
    npm test           # unit tests
    npm run e2e        # browser tests
    npm run check      # type check

## Updating the data

The data is entered by hand in `data/manual/` (`races.json` and `characters.json`). Every race and every objective carries a `verificar` flag: `true` until it is confirmed in the game, and unverified objectives show an "unverified" badge on the site.

    npm run data:build   # validates data/manual/ and writes src/data/*.json

The build stops with the file, the Uma (or race) and the field when something is wrong. Review the git diff of `src/data/` before committing.

## Credits

- Race calendar: [umamusu.wiki](https://umamusu.wiki) (CC BY-SA 4.0). Uma objectives: entered by the author; ones not yet checked in-game are marked unverified. See `DATA-LICENSE`.
- Built with [Claude](https://claude.ai) (Anthropic) as a coding assistant.

Fan-made project, not affiliated with Cygames. Umamusume: Pretty Derby is a trademark of Cygames, Inc. This project contains no images, icons, logos or fonts from Cygames or any other third party.
