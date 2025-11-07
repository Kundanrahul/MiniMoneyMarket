// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/Libraries/InterestRateModel.sol";

contract InterestRateModelTest is Test {
    InterestRateModel model;

    uint256 constant BASE = 0.02e18; // 2% annual
    uint256 constant SLOPE = 1e18;   // 100% slope

    function setUp() public {
        model = new InterestRateModel(BASE, SLOPE);
    }
    function testBaseRate() public view {
        uint256 rate = model.getBorrowRatePerYear(100e18, 0); // no borrows
        assertApproxEqAbs(rate, BASE, 1e14, "should equal base rate");
    }

    function testHalfUtilizationRate() public view {
        uint256 rate = model.getBorrowRatePerYear(100e18, 100e18); // util = 50%
        uint256 expected = BASE + (SLOPE / 2); // simpler: base + 0.5*slope
        assertApproxEqAbs(rate, expected, 1e14, "should equal base + 0.5*slope");
    }

    function testFullUtilizationRate() public view {
        uint256 rate = model.getBorrowRatePerYear(0, 100e18); // util = 100%
        uint256 expected = BASE + SLOPE;
        assertApproxEqAbs(rate, expected, 1e14, "should equal base + slope");
    }
}

