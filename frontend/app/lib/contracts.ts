import LendingPoolABI from "../abis/LendingPool.json";
import PriceOracleABI from "../abis/PriceOracle.json";
import InterestRateModelABI from "../abis/InterestRateModel.json";
import MockERC20ABI from "../abis/MockERC20.json";
import CollateralTokenABI from "../abis/CollateralToken.json";

export const CONTRACTS = {
  LendingPool: {
    address: "0xb6509579fCde3e0eD2fF1383E80624CF321dC793", 
    abi: LendingPoolABI,
  },
  PriceOracle: {
    address: "0x1ca32Cd24E6396C18DfA822965c4eb7B336EB33A",
    abi: PriceOracleABI,
  },
  InterestRateModel: {
    address: "0xF862c02A804E1b0b67024dDDC595D0153554adb1", 
    abi: InterestRateModelABI,
  },
  MockDAI: {
    address: "0xa6FB456163dd93B735aDb8e0FFb8dAA7EAB0dD0a", 
    abi: MockERC20ABI,
  },
  MockUSDC: {
    address: "0xd5B0666C5Fe3328D37B41f945834bBaE9b9Fa916",
    abi: MockERC20ABI,
  },
  MockERC20: {
    // generic ERC20 ABI fallback
    address: "0xa6FB456163dd93B735aDb8e0FFb8dAA7EAB0dD0a",
    abi: MockERC20ABI,
  },
  CollateralToken: {
    address: "0xaeEC5Af28CB9789B19CD4188405717c37b592CBF",
    abi: CollateralTokenABI,
  },
};





