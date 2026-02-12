import Decimal from 'break_eternity.js'
import type { ProcessNode, ProcessNodeDef } from '../types/fabrication'

export const PROCESS_NODES: Record<ProcessNode, ProcessNodeDef> = {
  '90nm': {
    id: '90nm',
    name: '90nm Process',
    year: 2002,
    unlocksChips: ['cpu_basic', 'gpu_basic', 'ram_basic'],
    unlocksWafers: ['basic_wafer'],
    unlockCost: { flops: new Decimal(0) }, // Starting node
    efficiency: 1,
  },
  '65nm': {
    id: '65nm',
    name: '65nm Process',
    year: 2006,
    unlocksChips: ['cpu_core'],
    unlocksWafers: ['refined_wafer'],
    unlockCost: { flops: new Decimal(1e9) }, // 1 GFLOPS
    efficiency: 1.5,
  },
  '45nm': {
    id: '45nm',
    name: '45nm Process',
    year: 2008,
    unlocksChips: ['gpu_gaming', 'ram_ddr5'],
    unlocksWafers: [],
    unlockCost: { flops: new Decimal(1e11) }, // 100 GFLOPS
    efficiency: 2,
  },
  '28nm': {
    id: '28nm',
    name: '28nm Process',
    year: 2011,
    unlocksChips: ['cpu_server', 'asic_miner'],
    unlocksWafers: ['pure_wafer'],
    unlockCost: { flops: new Decimal(1e13) }, // 10 TFLOPS
    efficiency: 3,
  },
  '14nm': {
    id: '14nm',
    name: '14nm FinFET',
    year: 2014,
    unlocksChips: ['gpu_compute'],
    unlocksWafers: [],
    unlockCost: { flops: new Decimal(1e15) }, // 1 PFLOPS
    efficiency: 5,
  },
  '7nm': {
    id: '7nm',
    name: '7nm EUV',
    year: 2018,
    unlocksChips: ['ram_hbm'],
    unlocksWafers: ['quantum_wafer'],
    unlockCost: { flops: new Decimal(1e17) }, // 100 PFLOPS
    efficiency: 10,
  },
  '5nm': {
    id: '5nm',
    name: '5nm EUV',
    year: 2020,
    unlocksChips: ['asic_ai'],
    unlocksWafers: [],
    unlockCost: { flops: new Decimal(1e19) }, // 10 EFLOPS
    efficiency: 20,
  },
  '3nm': {
    id: '3nm',
    name: '3nm GAA',
    year: 2023,
    unlocksChips: ['qpu_basic'],
    unlocksWafers: [],
    unlockCost: { flops: new Decimal(1e21) }, // 1 ZFLOPS
    efficiency: 50,
  },
}

export const NODE_ORDER: ProcessNode[] = ['90nm', '65nm', '45nm', '28nm', '14nm', '7nm', '5nm', '3nm']
