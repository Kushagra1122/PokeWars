// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PokemonMarketplace is ReentrancyGuard, Ownable {
    // Listing struct
    struct Listing {
        bytes32 listingId;
        address seller;
        string pokemonId;
        uint256 pokemonLevel;
        uint256 price;
        bool active;
        uint256 createdAt;
    }

    // Level upgrade struct
    struct LevelUpgrade {
        address player;
        string pokemonId;
        uint256 newLevel;
        uint256 cost;
        uint256 timestamp;
    }

    mapping(bytes32 => Listing) public listings;
    mapping(address => uint256) public sellerEarnings;
    mapping(address => uint256) public playerBalance;
    
    uint256 public platformFeePercent = 2; // 2% platform fee
    uint256 public levelUpgradeCost = 0.1 ether;
    address public platformFeeRecipient;

    event ListingCreated(
        bytes32 indexed listingId,
        address indexed seller,
        string pokemonId,
        uint256 pokemonLevel,
        uint256 price
    );

    event ListingSold(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed buyer,
        string pokemonId,
        uint256 price
    );

    event ListingCanceled(bytes32 indexed listingId, address indexed seller);

    event LevelUpgraded(
        address indexed player,
        string pokemonId,
        uint256 newLevel,
        uint256 cost
    );

    event BalanceUpdated(address indexed player, uint256 newBalance);

    event PlatformFeeUpdated(uint256 newFeePercent);

    event LevelUpgradeCostUpdated(uint256 newCost);

    constructor() Ownable(msg.sender) {
        platformFeeRecipient = msg.sender;
    }

    // Create a listing
    function createListing(
        bytes32 listingId,
        string memory pokemonId,
        uint256 pokemonLevel,
        uint256 price
    ) external nonReentrant {
        require(listings[listingId].seller == address(0), "Listing already exists");
        require(price > 0, "Price must be greater than 0");
        require(pokemonLevel > 0, "Level must be greater than 0");

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            pokemonId: pokemonId,
            pokemonLevel: pokemonLevel,
            price: price,
            active: true,
            createdAt: block.timestamp
        });

        emit ListingCreated(listingId, msg.sender, pokemonId, pokemonLevel, price);
    }

    // Buy from a listing
    function buyListing(bytes32 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(msg.value == listing.price, "Incorrect payment amount");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        listing.active = false;

        // Calculate fee and seller payout
        uint256 fee = (listing.price * platformFeePercent) / 100;
        uint256 sellerPayout = listing.price - fee;

        // Transfer to seller
        (bool success, ) = payable(listing.seller).call{value: sellerPayout}("");
        require(success, "Seller payout failed");

        // Transfer fee to platform
        (bool feeSuccess, ) = payable(platformFeeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        emit ListingSold(
            listingId,
            listing.seller,
            msg.sender,
            listing.pokemonId,
            listing.price
        );
    }

    // Cancel a listing
    function cancelListing(bytes32 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(msg.sender == listing.seller, "Only seller can cancel");

        listing.active = false;

        emit ListingCanceled(listingId, msg.sender);
    }

    // Upgrade Pokemon level
    function upgradePokemonLevel(string memory pokemonId) external payable nonReentrant {
        require(msg.value == levelUpgradeCost, "Incorrect payment for upgrade");

        // Transfer fee to platform
        (bool success, ) = payable(platformFeeRecipient).call{value: msg.value}("");
        require(success, "Payment failed");

        emit LevelUpgraded(msg.sender, pokemonId, 0, msg.value); // level update handled by backend
    }

    // Deposit funds to player balance
    function depositFunds() external payable nonReentrant {
        require(msg.value > 0, "Deposit must be greater than 0");
        playerBalance[msg.sender] += msg.value;
        emit BalanceUpdated(msg.sender, playerBalance[msg.sender]);
    }

    // Withdraw funds from player balance
    function withdrawFunds(uint256 amount) external nonReentrant {
        require(playerBalance[msg.sender] >= amount, "Insufficient balance");
        playerBalance[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit BalanceUpdated(msg.sender, playerBalance[msg.sender]);
    }

    // View functions
    function getListing(bytes32 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getPlayerBalance(address player) external view returns (uint256) {
        return playerBalance[player];
    }

    // Owner functions
    function setPlatformFeePercent(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 10, "Fee cannot exceed 10%");
        platformFeePercent = newFeePercent;
        emit PlatformFeeUpdated(newFeePercent);
    }

    function setLevelUpgradeCost(uint256 newCost) external onlyOwner {
        levelUpgradeCost = newCost;
        emit LevelUpgradeCostUpdated(newCost);
    }

    function setPlatformFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        platformFeeRecipient = newRecipient;
    }

    // Emergency withdraw
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    receive() external payable {}
}
