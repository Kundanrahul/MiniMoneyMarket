import LendingPoolABI from "../abis/LendingPool.json";
import PriceOracleABI from "../abis/PriceOracle.json";
import InterestRateModelABI from "../abis/InterestRateModel.json";
import MockERC20ABI from "../abis/MockERC20.json";
import CollateralTokenABI from "../abis/CollateralToken.json";

export const CONTRACTS = {
  LendingPool: {
    address: "0xe1bcdFe1998766Fae2E26dFB0B417f9C7723EC10", 
    abi: LendingPoolABI,
  },
  PriceOracle: {
    address: "0xE34c883E8d19A0CaFFC7511Fd1aF4fd88dE79CD9", 
    abi: PriceOracleABI,
  },
  InterestRateModel: {
    address: "0xdfA5Cb773d7527F0314DC521e0da7B0Ee8c7116E",  
    abi: InterestRateModelABI,
  },
  MockDAI: {
    address: "0xF45567131dc96DF38DE4974CE8F4D0e051Ce5Df3", 
    abi: MockERC20ABI,
  },
  MockUSDC: {
    address: "0x236bDcACC27c5460deaF7bF4a90aDbBE14B8191a", 
    abi: MockERC20ABI,
  },
  MockERC20: {
    // generic ERC20 ABI fallback
    address: "0xF45567131dc96DF38DE4974CE8F4D0e051Ce5Df3",
    abi: MockERC20ABI,
  },
  CollateralToken: {
    address: "0x2E133928A3F6Fbc0cb3514CcaA0d3907A066D0A4", 
    abi: CollateralTokenABI,
  },
  MockDAISwapper: {
    address: "0xE36696DCEfdaC47d9Ec2bBB318EEA930524ee3fE", 
    abi: ["event Swapped(address indexed user,uint256 ethIn,uint256 daiOut)"],
  },
};




