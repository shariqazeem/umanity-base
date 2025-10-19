import { baseSepolia } from 'viem/chains';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`;

export const CONTRACT_ABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "donateRandom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "poolType", type: "uint8" },
      { name: "amount", type: "uint256" }
    ],
    name: "donateToPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "story", type: "string" },
      { name: "proofUrl", type: "string" }
    ],
    name: "applyAsRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_donor", type: "address" }],
    name: "getDonorStats",
    outputs: [
      { name: "totalDonated_", type: "uint256" },
      { name: "donationCount_", type: "uint256" },
      { name: "rank_", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllPools",
    outputs: [
      { name: "names", type: "string[3]" },
      { name: "totals", type: "uint256[3]" },
      { name: "available", type: "uint256[3]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "poolType", type: "uint8" }],
    name: "getPoolInfo",
    outputs: [
      { name: "name", type: "string" },
      { name: "totalDonated_", type: "uint256" },
      { name: "totalWithdrawn_", type: "uint256" },
      { name: "available", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPlatformStats",
    outputs: [
      { name: "totalDonated_", type: "uint256" },
      { name: "totalDonationCount_", type: "uint256" },
      { name: "recipientCount_", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const CHAIN = baseSepolia;

// Pool types enum
export enum PoolType {
  EDUCATION = 0,
  HEALTHCARE = 1,
  EMERGENCY = 2,
}