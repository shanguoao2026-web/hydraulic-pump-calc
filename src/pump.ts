export interface PumpInputs {
  displacement: number;
  rpm: number;
  pressure: number;
  volEff?: number;
  totalEff?: number;
  pipeId?: number;
}

export interface PumpResult {
  theoreticalFlowLMin: number;
  flowLMin: number;
  hydraulicPowerKW: number;
  inputPowerKW: number;
  mechanicalEfficiency: number;
  torqueNm: number;
  lineVelocityMS?: number;
}

export function calculatePump(inputs: PumpInputs): PumpResult {
  const { displacement, rpm, pressure, pipeId } = inputs;
  const volEff = inputs.volEff ?? 0.95;
  const totalEff = inputs.totalEff ?? 0.85;
  for (const [name, value] of Object.entries({ displacement, rpm, pressure, volEff, totalEff, ...(pipeId === undefined ? {} : { pipeId }) })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a finite number greater than zero`);
    }
  }
  if (volEff > 1) throw new Error('vol-eff must be at most 1');
  if (totalEff > volEff) throw new Error('total-eff must be at most vol-eff');

  const theoreticalFlowLMin = displacement * rpm / 1000;
  const flowLMin = theoreticalFlowLMin * volEff;
  const mechanicalEfficiency = totalEff / volEff;
  const result: PumpResult = {
    theoreticalFlowLMin,
    flowLMin,
    hydraulicPowerKW: pressure * flowLMin / 600,
    inputPowerKW: pressure * flowLMin / (600 * totalEff),
    mechanicalEfficiency,
    torqueNm: displacement * pressure / (20 * Math.PI * mechanicalEfficiency),
  };
  if (pipeId !== undefined) {
    result.lineVelocityMS = (flowLMin / 60000) / (Math.PI * (pipeId / 2000) ** 2);
  }
  if (Object.values(result).some(value => !Number.isFinite(value))) {
    throw new Error('Inputs produce a non-finite result; use smaller values');
  }
  return result;
}
