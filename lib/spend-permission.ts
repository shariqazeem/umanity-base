import { requestSpendPermission, prepareSpendCallData } from '@base-org/account/spend-permission';
import { USDC_ADDRESS, CONTRACT_ADDRESS } from './contract';
import { baseSepolia } from 'viem/chains';

export async function requestUSDCSpendPermission(
  userAddress: string,
  subAccountAddress: string,
  provider: any
) {
  try {
    // Request spend permission for USDC
    const permission = await requestSpendPermission({
      account: userAddress, // Universal account
      spender: subAccountAddress, // Sub account that will spend
      token: USDC_ADDRESS,
      chainId: baseSepolia.id,
      allowance: 100_000_000n, // 100 USDC allowance
      periodInDays: 30, // 30 day period
      provider,
    });

    console.log('Spend permission granted:', permission);
    return permission;
  } catch (error) {
    console.error('Error requesting spend permission:', error);
    throw error;
  }
}

export async function prepareDonationWithSpendPermission(
  permission: any,
  amount: bigint
) {
  try {
    // Prepare the spend calls
    const spendCalls = await prepareSpendCallData({
      permission,
      amount,
    });

    return spendCalls;
  } catch (error) {
    console.error('Error preparing spend calls:', error);
    throw error;
  }
}