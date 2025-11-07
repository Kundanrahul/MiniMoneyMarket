// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import "../../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title MockERC20
/// @notice Simple mintable ERC20 token used for testing the ProtoFi protocol.
contract MockERC20 is ERC20, Ownable {
    uint8 private _customDecimals;

    /// @param name_ Token name (e.g., "Mock DAI")
    /// @param symbol_ Token symbol (e.g., "mDAI")
    /// @param decimals_ Number of decimals (e.g., 18)
    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) Ownable(msg.sender) {
        _customDecimals = decimals_;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
// returns token's decimals
    function decimals() public view virtual override returns (uint8) {
        return _customDecimals;
    }
}

