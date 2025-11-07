// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "./Interfaces/IPriceOracle.sol";

contract PriceOracle is IPriceOracle, Ownable {
    uint256 public constant WAD = 1e18;

    struct PriceData {
        uint256 price;         // latest price
        uint256 cumulative;    // cumulative price * time
        uint256 lastUpdate;    // timestamp of last update
    }

    mapping(address => PriceData) private _data;

    uint256 public maxStaleness = 1 days;
    bool public stalenessCheckEnabled = true;

    event PriceUpdated(address indexed token, uint256 price, uint256 ts);
    event MaxStalenessUpdated(uint256 maxStaleness);
    event StalenessCheckToggled(bool enabled);

    constructor() Ownable(msg.sender) {}

    function setPrice(address token, uint256 priceWad) external onlyOwner {
        PriceData storage d = _data[token];

        // Update cumulative: previous cumulative + (price * time elapsed)
        if (d.lastUpdate != 0) {
            uint256 timeElapsed = block.timestamp - d.lastUpdate;
            d.cumulative += d.price * timeElapsed;
        }

        d.price = priceWad;
        d.lastUpdate = block.timestamp;

        emit PriceUpdated(token, priceWad, block.timestamp);
    }

    function getPrice(address token) external view override returns (uint256) {
        PriceData storage d = _data[token];
        require(d.price > 0, "PriceOracle: price-zero");

        if (stalenessCheckEnabled) {
            require(block.timestamp - d.lastUpdate <= maxStaleness, "PriceOracle: stale");
        }

        return d.price;
    }

    function getLastUpdate(address token) external view override returns (uint256) {
        return _data[token].lastUpdate;
    }

    function setMaxStaleness(uint256 s) external onlyOwner {
        maxStaleness = s;
        emit MaxStalenessUpdated(s);
    }

    function setStalenessCheckEnabled(bool enabled) external onlyOwner {
        stalenessCheckEnabled = enabled;
        emit StalenessCheckToggled(enabled);
    }

    /// @notice Returns TWAP over the given interval (in seconds)
    function getTWAP(address token, uint256 interval) external view returns (uint256) {
        PriceData storage d = _data[token];
        require(d.lastUpdate > 0, "PriceOracle: no data");

        uint256 timeElapsed = block.timestamp - d.lastUpdate;
        require(timeElapsed <= interval, "PriceOracle: interval too long");

        // Add current price * time since last update to cumulative
        uint256 cumulativeNow = d.cumulative + d.price * timeElapsed;

        // TWAP = cumulative / interval
        return cumulativeNow / interval;
    }
}


