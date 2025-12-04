// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SimpleToken.sol";

/**
 * Token Factory Contract
 * Deploys SimpleToken contracts and tracks them
 * This is a deployable contract (not just an interface)
 */
contract TokenFactory {
    // Mapping to track tokens created by each address
    mapping(address => address[]) public tokensByCreator;
    
    // Event emitted when a new token is created
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 totalSupply,
        uint8 decimals
    );
    
    /**
     * Create a new ERC20 token
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Total supply of tokens
     * @param decimals Number of decimals
     * @return tokenAddress Address of the newly created token contract
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals
    ) public returns (address tokenAddress) {
        // Deploy a new SimpleToken contract
        SimpleToken newToken = new SimpleToken(name, symbol, totalSupply, decimals);
        tokenAddress = address(newToken);
        
        // Track the token
        tokensByCreator[msg.sender].push(tokenAddress);
        
        // Emit event
        emit TokenCreated(tokenAddress, msg.sender, name, symbol, totalSupply, decimals);
        
        return tokenAddress;
    }
    
    /**
     * Get the address of a token created by this factory
     * @param creator Address of the creator
     * @param index Index of the token (0-based)
     * @return tokenAddress Address of the token
     */
    function getToken(address creator, uint256 index) public view returns (address tokenAddress) {
        require(index < tokensByCreator[creator].length, "Index out of bounds");
        return tokensByCreator[creator][index];
    }
    
    /**
     * Get the number of tokens created by an address
     * @param creator Address of the creator
     * @return count Number of tokens created
     */
    function getTokenCount(address creator) public view returns (uint256 count) {
        return tokensByCreator[creator].length;
    }
    
    /**
     * Get all tokens created by an address
     * @param creator Address of the creator
     * @return tokens Array of token addresses
     */
    function getAllTokens(address creator) public view returns (address[] memory tokens) {
        return tokensByCreator[creator];
    }
}
