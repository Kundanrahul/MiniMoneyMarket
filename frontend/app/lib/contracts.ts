import LendingPoolABI from "../abis/LendingPool.json";
import PriceOracleABI from "../abis/PriceOracle.json";
import InterestRateModelABI from "../abis/InterestRateModel.json";
import MockERC20ABI from "../abis/MockERC20.json";
import CollateralTokenABI from "../abis/CollateralToken.json";

export const CONTRACTS = {
  LendingPool: {
    address: "0xb2Feb95eDFCD70CEC44C418F91D80483eAA77167",
    abi: LendingPoolABI,
  },
  PriceOracle: {
    address: "0xFD128c0CBab5AE28299360864F7f60eE0978F2B9",
    abi: PriceOracleABI,
  },
  InterestRateModel: {
    address: "0x00e61243808f6451151017BbD079eeAE8b448557",
    abi: InterestRateModelABI,
  },
  MockDAI: {
    address: "0x98fBe6687dF5843143Ec1CdC7Ff37C714F0B6963",
    abi: MockERC20ABI,
  },
  MockUSDC: {
    address: "0x82903D8934c2DDD78Ea403e53608E67d3E1a7070", 
    abi: MockERC20ABI,
  },
  MockERC20: {
    // generic ERC20 ABI fallback
    address: "0x98fBe6687dF5843143Ec1CdC7Ff37C714F0B6963",
    abi: MockERC20ABI,
  },
  CollateralToken: {
    address: "0xe1E89291bdC7777F0C9aB1C6a79B086dc4dCC9f3",
    abi: CollateralTokenABI,
  },
};





