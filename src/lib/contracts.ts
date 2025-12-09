// PlayArena Escrow Contract ABI (simplified for frontend)
export const ESCROW_ABI = [
  {
    name: 'createMatch',
    type: 'function',
    inputs: [
      { name: 'matchIdHash', type: 'bytes32' },
      { name: 'stakePerPlayer', type: 'uint256' },
      { name: 'playersRequired', type: 'uint8' },
      { name: 'rounds', type: 'uint8' },
      { name: 'token', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'joinMatch',
    type: 'function',
    inputs: [{ name: 'matchIdHash', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'deposit',
    type: 'function',
    inputs: [{ name: 'matchIdHash', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'claimWinnings',
    type: 'function',
    inputs: [{ name: 'matchIdHash', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'getMatch',
    type: 'function',
    inputs: [{ name: 'matchIdHash', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'bytes32' },
          { name: 'creator', type: 'address' },
          { name: 'stakePerPlayer', type: 'uint256' },
          { name: 'playersRequired', type: 'uint8' },
          { name: 'players', type: 'address[]' },
          { name: 'rounds', type: 'uint8' },
          { name: 'state', type: 'uint8' },
          { name: 'totalDeposited', type: 'uint256' },
          { name: 'winner', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    name: 'MatchCreated',
    type: 'event',
    inputs: [
      { name: 'matchId', type: 'bytes32', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'stakePerPlayer', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'PlayerJoined',
    type: 'event',
    inputs: [
      { name: 'matchId', type: 'bytes32', indexed: true },
      { name: 'player', type: 'address', indexed: true },
    ],
  },
  {
    name: 'MatchStarted',
    type: 'event',
    inputs: [{ name: 'matchId', type: 'bytes32', indexed: true }],
  },
  {
    name: 'WinningsClaimed',
    type: 'event',
    inputs: [
      { name: 'matchId', type: 'bytes32', indexed: true },
      { name: 'winner', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ERC20 ABI for USDC approval
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

// Match states enum
export enum MatchState {
  CREATED = 0,
  WAITING = 1,
  ACTIVE = 2,
  COMPLETE = 3,
  CANCELLED = 4,
}

export const matchStateLabels: Record<MatchState, string> = {
  [MatchState.CREATED]: 'Created',
  [MatchState.WAITING]: 'Waiting for Players',
  [MatchState.ACTIVE]: 'In Progress',
  [MatchState.COMPLETE]: 'Complete',
  [MatchState.CANCELLED]: 'Cancelled',
};
