import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { calculatePump } from '../dist/pump.js';

const base = ['--displacement', '10', '--rpm', '1500', '--pressure', '100'];
const run = (...args) => spawnSync(process.execPath, ['dist/cli.js', ...args], { encoding: 'utf8' });
const close = (actual, expected, tolerance) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`);

test('reference calculation and pipe velocity', () => {
  const result = run(...base, '--pipe-id', '12', '--json');
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const data = JSON.parse(result.stdout);
  assert.equal(data.theoreticalFlowLMin, 15);
  assert.equal(data.flowLMin, 14.25);
  assert.equal(data.hydraulicPowerKW, 2.375);
  close(data.inputPowerKW, 2.794, 0.0005);
  close(data.torqueNm, 17.79, 0.005);
  close(data.lineVelocityMS, 2.100, 0.0005);
  close(data.mechanicalEfficiency, 0.85 / 0.95, 1e-12);
});

test('default table includes rounded results and optional velocity', () => {
  const result = run(...base, '--pipe-id', '12');
  assert.equal(result.status, 0);
  for (const text of ['14.250', '2.375', '2.794', '17.79', '2.100', 'L/min', 'N·m', 'm/s']) {
    assert.ok(result.stdout.includes(text), text);
  }
  assert.ok(!run(...base).stdout.includes('Line velocity'));
  assert.ok(!('lineVelocityMS' in JSON.parse(run(...base, '--json').stdout)));
});

test('help succeeds without required inputs', () => {
  const result = run('--help');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.equal(result.stderr, '');
});

for (const [label, args] of [
  ['total efficiency above volumetric', [...base, '--vol-eff', '0.95', '--total-eff', '0.97']],
  ['zero rpm', ['--displacement', '10', '--rpm', '0', '--pressure', '100']],
  ['missing required', []],
  ['missing value', [...base, '--pipe-id']],
  ['next option as value', [...base, '--pipe-id', '--json']],
  ['unknown option', [...base, '--wat']],
  ['duplicate', [...base, '--rpm', '20']],
  ...['NaN', 'Infinity', '-Infinity', 'abc', '', ' '].map(value => [`invalid number ${value}`, [...base, '--pipe-id', value]]),
  ...['0', '-1'].map(value => [`invalid diameter ${value}`, [...base, '--pipe-id', value]]),
  ['volumetric above one', [...base, '--vol-eff', '1.1']],
  ['zero volumetric', [...base, '--vol-eff', '0']],
  ['negative total', [...base, '--total-eff', '-0.5']],
  ['overflow', ['--displacement', '1e308', '--rpm', '1e308', '--pressure', '100']],
]) {
  test(`rejects ${label}`, () => {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^Error:/);
  });
}

test('custom efficiencies and diameter obey formulas', () => {
  const data = calculatePump({ displacement: 20, rpm: 1000, pressure: 200, volEff: 0.9, totalEff: 0.72, pipeId: 20 });
  assert.equal(data.flowLMin, 18);
  assert.equal(data.hydraulicPowerKW, 6);
  close(data.inputPowerKW, 6 / 0.72, 1e-12);
  close(data.torqueNm, 4000 / (20 * Math.PI * 0.8), 1e-12);
  close(data.lineVelocityMS, (18 / 60000) / (Math.PI * 0.01 ** 2), 1e-12);
});

test('unit efficiencies are accepted', () => {
  assert.equal(run(...base, '--vol-eff', '1', '--total-eff', '1').status, 0);
});
