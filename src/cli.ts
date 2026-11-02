#!/usr/bin/env node
import { writeSync } from 'node:fs';
import { calculatePump, type PumpInputs, type PumpResult } from './pump.js';

const help = `Usage: hydraulic-pump-calc --displacement V --rpm n --pressure p [options]

Size a hydraulic gear or piston pump drive (Node 18+).

  --displacement V  Displacement in cm³/rev (required, >0)
  --rpm n           Pump speed in rev/min (required, >0)
  --pressure p      Pressure in bar (required, >0)
  --vol-eff ηv      Volumetric efficiency (default 0.95, 0<ηv≤1)
  --total-eff ηt    Total efficiency (default 0.85, 0<ηt≤ηv)
  --pipe-id d       Pipe internal diameter in mm (optional, >0)
  --json            Print full-precision results as JSON
  --help            Show this help
`;

const options: Record<string, keyof PumpInputs> = {
  '--displacement': 'displacement', '--rpm': 'rpm', '--pressure': 'pressure',
  '--vol-eff': 'volEff', '--total-eff': 'totalEff', '--pipe-id': 'pipeId',
};

function table(result: PumpResult): string {
  const rows: [string, number, string, number][] = [
    ['Theoretical flow', result.theoreticalFlowLMin, 'L/min', 3],
    ['Flow', result.flowLMin, 'L/min', 3],
    ['Hydraulic power', result.hydraulicPowerKW, 'kW', 3],
    ['Input (shaft) power', result.inputPowerKW, 'kW', 3],
    ['Mechanical efficiency', result.mechanicalEfficiency, '', 6],
    ['Drive torque', result.torqueNm, 'N·m', 2],
  ];
  if (result.lineVelocityMS !== undefined) rows.push(['Line velocity', result.lineVelocityMS, 'm/s', 3]);
  return ['Quantity                |        Value | Unit',
    '------------------------|--------------|------',
    ...rows.map(([label, value, unit, digits]) => `${label.padEnd(23)} | ${value.toFixed(digits).padStart(12)} | ${unit}`)].join('\n');
}

try {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    writeSync(1, help);
  } else {
    const inputs: Partial<PumpInputs> = {};
    const seen = new Set<string>();
    let json = false;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (seen.has(arg)) throw new Error(`Duplicate option: ${arg}`);
      seen.add(arg);
      if (arg === '--json') { json = true; continue; }
      const key = options[arg];
      if (!Object.hasOwn(options, arg)) throw new Error(`Unknown option: ${arg}`);
      const raw = args[++i];
      if (raw === undefined || raw.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      const value = raw.trim() === '' ? NaN : Number(raw);
      if (!Number.isFinite(value)) throw new Error(`${arg} requires a finite number`);
      inputs[key] = value;
    }
    for (const key of ['displacement', 'rpm', 'pressure'] as const) {
      if (inputs[key] === undefined) throw new Error(`Missing required option: --${key}`);
    }
    const result = calculatePump(inputs as PumpInputs);
    writeSync(1, (json ? JSON.stringify(result, null, 2) : table(result)) + '\n');
  }
} catch (error) {
  writeSync(2, `Error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
