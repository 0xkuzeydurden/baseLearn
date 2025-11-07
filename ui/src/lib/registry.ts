import type { Abi } from "viem";

export const registryAbi = [
  {
    type: "function",
    name: "testContract",
    stateMutability: "nonpayable",
    inputs: [{ name: "submission", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "owners",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }]
  }
] as const satisfies Abi;
