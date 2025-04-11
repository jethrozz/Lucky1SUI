import { getFullnodeUrl } from "@mysten/sui/client";
import {
  LOTTERY_ID,
  TICKET_POOL_ID,
  PACKAGE_ID,
  CLOCK_ID,
  RANDOM_ID,
  NFT_TYPE,
  POOL_SUI_ID,
  INCENTIVE_V3_ID,
  INCENTIVE_V2_ID,
  REWARDFUND_ID,
  STORAGE_ID,
  PRICE_ORACLE_ID,
  SUI_COIN_TYPE,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId: PACKAGE_ID,
        lotteryId: LOTTERY_ID,
        ticketPoolId: TICKET_POOL_ID,
        clockId: CLOCK_ID,
        randomId: RANDOM_ID,
        nftType: NFT_TYPE,
        poolSuiId: POOL_SUI_ID,
        incentiveV2Id: INCENTIVE_V2_ID,
        incentiveV3Id: INCENTIVE_V3_ID,
        rewardFundId: REWARDFUND_ID,
        storageId: STORAGE_ID,
        priceOracleId: PRICE_ORACLE_ID,
        suiCoinType: SUI_COIN_TYPE,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: PACKAGE_ID,
        lotteryId: LOTTERY_ID,
        ticketPoolId: TICKET_POOL_ID,
        clockId: CLOCK_ID,
        randomId: RANDOM_ID,
        nftType: NFT_TYPE,
        poolSuiId: POOL_SUI_ID,
        incentiveV2Id: INCENTIVE_V2_ID,
        incentiveV3Id: INCENTIVE_V3_ID,
        rewardFundId: REWARDFUND_ID,
        storageId: STORAGE_ID,
        priceOracleId: PRICE_ORACLE_ID,
        suiCoinType: SUI_COIN_TYPE,      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId: PACKAGE_ID,
        lotteryId: LOTTERY_ID,
        ticketPoolId: TICKET_POOL_ID,
        clockId: CLOCK_ID,
        randomId: RANDOM_ID,
        nftType: NFT_TYPE,
        poolSuiId: POOL_SUI_ID,
        incentiveV2Id: INCENTIVE_V2_ID,
        incentiveV3Id: INCENTIVE_V3_ID,
        rewardFundId: REWARDFUND_ID,
        storageId: STORAGE_ID,
        priceOracleId: PRICE_ORACLE_ID,
        suiCoinType: SUI_COIN_TYPE,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
