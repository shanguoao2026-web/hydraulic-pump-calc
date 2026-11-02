# hydraulic-pump-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) that sizes a hydraulic gear/piston pump drive.

Inputs: --displacement V (cm³/rev, required, >0), --rpm n (required, >0), --pressure p (bar, required, >0), --vol-eff ηv (default 0.95, 0<η≤1), --total-eff ηt (default 0.85, 0<ηt≤ηv), optional --pipe-id d (mm, prints line velocity), --json, --help.
Formulas:
- Flow Q = V·n·ηv/1000 (L/min); theoretical flow V·n/1000.
- Hydraulic power Ph = p·Q/600 (kW).
- Input (shaft) power Pin = p·Q/(600·ηt) (kW).
- Mechanical efficiency ηm = ηt/ηv; drive torque T = V·p/(20π·ηm) (N·m).
- Line velocity v = (Q/60000)/(π·(d/2000)²) (m/s).
- Validate finite numbers; errors to stderr with exit 1.
- Table output by default, README with examples, MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log .npm-cache/.
- package.json "bin" must point to the built CLI. npm test must build and pass. No secrets, no personal info.

Check values (must be in tests):
- V10 n1500 p100 ηv0.95 ηt0.85 → Q 14.25 L/min, Ph 2.375 kW, Pin 2.794 kW, T 17.79 N·m.
- plus --pipe-id 12 → v 2.100 m/s.
- ηt 0.97 with ηv 0.95 → exit 1; rpm 0 → exit 1.
