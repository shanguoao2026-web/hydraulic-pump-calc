# hydraulic-pump-calc

A TypeScript Node CLI for sizing a hydraulic gear or piston pump drive. Requires
Node 18+ and has no runtime dependencies.

```sh
npm install
npm run build
node dist/cli.js --displacement 10 --rpm 1500 --pressure 100
node dist/cli.js --displacement 10 --rpm 1500 --pressure 100 --pipe-id 12 --json
node dist/cli.js --help
npm test
```

After building, `npm link` makes the `hydraulic-pump-calc` command available locally.

| Option | Unit / constraint | Default |
| --- | --- | --- |
| `--displacement` | cm³/rev, finite and >0 | required |
| `--rpm` | rev/min, finite and >0 | required |
| `--pressure` | bar, finite and >0 | required |
| `--vol-eff` | fraction, 0 < ηv ≤ 1 | 0.95 |
| `--total-eff` | fraction, 0 < ηt ≤ ηv | 0.85 |
| `--pipe-id` | mm, finite and >0 | omitted |
| `--json` | full-precision JSON output | table output |
| `--help` | usage information | |

Pass options and their values as separate arguments. Invalid or duplicate options,
missing inputs, and invalid numbers produce an error on stderr with exit code 1.
Help exits with code 0. If you lower volumetric efficiency below 0.85, also supply
a compatible total efficiency.

For the first example, flow is 14.250 L/min, hydraulic power is 2.375 kW,
shaft input power is 2.794 kW, and drive torque is 17.79 N·m.
A 12 mm pipe gives a line velocity of 2.100 m/s.

Calculations use displacement V, speed n, pressure p, volumetric efficiency ηv,
total efficiency ηt, and optional pipe internal diameter d:

- Theoretical flow: V × n / 1000 L/min
- Delivered flow Q: V × n × ηv / 1000 L/min
- Hydraulic power: p × Q / 600 kW
- Shaft input power: p × Q / (600 × ηt) kW
- Mechanical efficiency ηm: ηt / ηv
- Drive torque: V × p / (20 × π × ηm) N·m
- Line velocity: (Q / 60000) / (π × (d / 2000)²) m/s

JSON fields are `theoreticalFlowLMin`, `flowLMin`, `hydraulicPowerKW`,
`inputPowerKW`, `mechanicalEfficiency`, `torqueNm`, and (when a pipe diameter is
provided) `lineVelocityMS`. Table values are rounded for display; JSON preserves
JavaScript numeric precision.

Licensed under the MIT License. Copyright 2026 shanguoao2026-web.
