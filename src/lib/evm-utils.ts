import { createPublicClient, http } from "viem";
import { mainnet, arbitrum, base } from "wagmi/chains";

export const evmClients = {
  mainnet: createPublicClient({ chain: mainnet, transport: http() }),
  arbitrum: createPublicClient({ chain: arbitrum, transport: http() }),
  base: createPublicClient({ chain: base, transport: http() })
};

export async function getWalletNativeBalances(_address?: `0x${string}`) {
  void _address;
  // Extend with multicall/token balances as protocols are integrated.
  return {
    ethereum: 0,
    arbitrum: 0,
    base: 0
  };
}
