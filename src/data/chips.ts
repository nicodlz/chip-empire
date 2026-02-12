import Decimal from 'break_eternity.js'
import type { ChipDef, ChipId } from '../types/fabrication'

export const CHIPS: Record<ChipId, ChipDef> = {
  // CPUs
  cpu_basic: {
    id: 'cpu_basic',
    name: 'Basic CPU',
    emoji: '🔲',
    category: 'cpu',
    tier: 1,
    node: '90nm',
    waferCost: { type: 'basic_wafer', amount: 1 },
    craftTime: 3000,
    flopsPerSecond: new Decimal(1e6), // 1 MFLOPS
    description: 'Simple processor. Gets the job done.',
  },
  cpu_core: {
    id: 'cpu_core',
    name: 'Core Processor',
    emoji: '💠',
    category: 'cpu',
    tier: 2,
    node: '65nm',
    waferCost: { type: 'refined_wafer', amount: 1 },
    extraCosts: { gold: 5 },
    craftTime: 5000,
    flopsPerSecond: new Decimal(1e8), // 100 MFLOPS
    description: 'Multi-core architecture. Serious compute.',
  },
  cpu_server: {
    id: 'cpu_server',
    name: 'Server CPU',
    emoji: '🖥️',
    category: 'cpu',
    tier: 3,
    node: '28nm',
    waferCost: { type: 'pure_wafer', amount: 2 },
    extraCosts: { gold: 20, cobalt: 5 },
    craftTime: 10000,
    flopsPerSecond: new Decimal(1e10), // 10 GFLOPS
    description: 'Datacenter-grade. Always-on compute.',
  },

  // GPUs
  gpu_basic: {
    id: 'gpu_basic',
    name: 'Basic GPU',
    emoji: '🎮',
    category: 'gpu',
    tier: 1,
    node: '90nm',
    waferCost: { type: 'basic_wafer', amount: 2 },
    extraCosts: { copper: 50 },
    craftTime: 4000,
    flopsPerSecond: new Decimal(1e7), // 10 MFLOPS
    description: 'Parallel processing. Great for graphics.',
  },
  gpu_gaming: {
    id: 'gpu_gaming',
    name: 'Gaming GPU',
    emoji: '🎯',
    category: 'gpu',
    tier: 2,
    node: '45nm',
    waferCost: { type: 'refined_wafer', amount: 2 },
    extraCosts: { gold: 15, tin: 10 },
    craftTime: 8000,
    flopsPerSecond: new Decimal(1e9), // 1 GFLOPS
    description: 'High-end graphics. Smooth 60fps.',
  },
  gpu_compute: {
    id: 'gpu_compute',
    name: 'Compute GPU',
    emoji: '🧮',
    category: 'gpu',
    tier: 3,
    node: '14nm',
    waferCost: { type: 'pure_wafer', amount: 3 },
    extraCosts: { gold: 50, neodymium: 10 },
    craftTime: 15000,
    flopsPerSecond: new Decimal(1e12), // 1 TFLOPS
    description: 'AI training beast. Tensor cores included.',
  },

  // Memory
  ram_basic: {
    id: 'ram_basic',
    name: 'Basic RAM',
    emoji: '📝',
    category: 'memory',
    tier: 1,
    node: '90nm',
    waferCost: { type: 'basic_wafer', amount: 1 },
    craftTime: 2000,
    flopsPerSecond: new Decimal(1e5), // 100 KFLOPS (memory assists compute)
    description: 'Volatile storage. Fast but forgetful.',
  },
  ram_ddr5: {
    id: 'ram_ddr5',
    name: 'DDR5 Module',
    emoji: '⚡',
    category: 'memory',
    tier: 2,
    node: '45nm',
    waferCost: { type: 'refined_wafer', amount: 1 },
    extraCosts: { silver: 10 },
    craftTime: 4000,
    flopsPerSecond: new Decimal(1e7), // 10 MFLOPS
    description: 'High bandwidth. Feeds hungry CPUs.',
  },
  ram_hbm: {
    id: 'ram_hbm',
    name: 'HBM Stack',
    emoji: '🏗️',
    category: 'memory',
    tier: 3,
    node: '7nm',
    waferCost: { type: 'quantum_wafer', amount: 1 },
    extraCosts: { indium: 5 },
    craftTime: 20000,
    flopsPerSecond: new Decimal(1e11), // 100 GFLOPS
    description: '3D stacked memory. Bandwidth monster.',
  },

  // ASICs
  asic_miner: {
    id: 'asic_miner',
    name: 'Mining ASIC',
    emoji: '⛏️',
    category: 'asic',
    tier: 2,
    node: '28nm',
    waferCost: { type: 'pure_wafer', amount: 1 },
    extraCosts: { copper: 100, tantalum: 5 },
    craftTime: 8000,
    flopsPerSecond: new Decimal(1e11), // 100 GFLOPS (hash-optimized)
    description: 'One job, done perfectly. Hashes for days.',
  },
  asic_ai: {
    id: 'asic_ai',
    name: 'AI Accelerator',
    emoji: '🧠',
    category: 'asic',
    tier: 3,
    node: '5nm',
    waferCost: { type: 'quantum_wafer', amount: 2 },
    extraCosts: { hafnium: 5, germanium: 3 },
    craftTime: 25000,
    flopsPerSecond: new Decimal(1e14), // 100 TFLOPS
    description: 'Neural engine. Thinks faster than you.',
  },

  // Quantum
  qpu_basic: {
    id: 'qpu_basic',
    name: 'Quantum Processor',
    emoji: '🌀',
    category: 'quantum',
    tier: 4,
    node: '3nm',
    waferCost: { type: 'quantum_wafer', amount: 5 },
    extraCosts: { hafnium: 20, germanium: 10, neodymium: 15 },
    craftTime: 60000,
    flopsPerSecond: new Decimal(1e18), // 1 EFLOPS (quantum supremacy)
    description: 'Qubits entangled. Reality bends here.',
  },
}

export const CHIP_ORDER: ChipId[] = [
  'cpu_basic', 'gpu_basic', 'ram_basic',
  'cpu_core', 'gpu_gaming', 'ram_ddr5',
  'cpu_server', 'gpu_compute', 'asic_miner',
  'ram_hbm', 'asic_ai',
  'qpu_basic',
]

export const STARTER_CHIPS: ChipId[] = ['cpu_basic', 'gpu_basic', 'ram_basic']
