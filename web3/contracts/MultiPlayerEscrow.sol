// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiPlayerEscrow is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;

    struct Game {
        bytes32 gameId;
        address[] players;
        uint256 stakeAmount;
        mapping(address => bool) playerStaked;
        mapping(address => uint256) playerStakes;
        bool settled;
        bool canceled;
        uint256 createdAt;
        uint256 totalStaked;
    }

    mapping(bytes32 => Game) public games;
    mapping(address => uint256) public points;

    // EIP-712 domain separator
    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
    bytes32 private constant GAME_RESULT_TYPEHASH =
        keccak256(
            "GameResult(bytes32 gameId,address[] players,address winner,uint256[] scores,uint256 serverNonce)"
        );

    string private constant NAME = "PokeWars MultiPlayerEscrow";
    string private constant VERSION = "1";

    event GameCreated(
        bytes32 indexed gameId,
        address[] players,
        uint256 stakeAmount
    );
    event PlayerStaked(
        bytes32 indexed gameId,
        address indexed player,
        uint256 amount
    );
    event GameResult(
        bytes32 indexed gameId,
        address indexed winner,
        uint256[] scores,
        uint256 totalPayout,
        uint256 serverNonce
    );
    event GameCanceled(bytes32 indexed gameId, string reason);
    event PointsUpdated(address indexed player, uint256 totalPoints);

    constructor() Ownable(msg.sender) {}

    function createGame(
        bytes32 gameId,
        address[] calldata players,
        uint256 stakeAmount
    ) external nonReentrant {
        require(games[gameId].createdAt == 0, "Game already exists");
        require(players.length >= 2, "Need at least 2 players");
        require(stakeAmount > 0, "Stake must be positive");

        Game storage game = games[gameId];
        game.gameId = gameId;
        game.stakeAmount = stakeAmount;
        game.createdAt = block.timestamp;

        for (uint256 i = 0; i < players.length; i++) {
            game.players.push(players[i]);
        }

        emit GameCreated(gameId, players, stakeAmount);
    }

    function stake(bytes32 gameId) external payable nonReentrant {
        Game storage game = games[gameId];
        require(game.createdAt > 0, "Game does not exist");
        require(!game.settled && !game.canceled, "Game already resolved");
        require(msg.value == game.stakeAmount, "Incorrect stake amount");
        require(!game.playerStaked[msg.sender], "Already staked");

        // Check if player is in the game
        bool isPlayer = false;
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] == msg.sender) {
                isPlayer = true;
                break;
            }
        }
        require(isPlayer, "Not authorized to stake in this game");

        game.playerStaked[msg.sender] = true;
        game.playerStakes[msg.sender] = msg.value;
        game.totalStaked += msg.value;

        emit PlayerStaked(gameId, msg.sender, msg.value);
    }

    function submitResult(
        bytes32 gameId,
        address winner,
        uint256[] calldata scores,
        uint256 serverNonce,
        bytes[] calldata signatures
    ) external nonReentrant {
        Game storage game = games[gameId];
        require(game.createdAt > 0, "Game does not exist");
        require(!game.settled && !game.canceled, "Game already resolved");
        require(scores.length == game.players.length, "Invalid scores length");
        require(signatures.length == game.players.length, "Invalid signatures length");

        // Verify all players have staked
        for (uint256 i = 0; i < game.players.length; i++) {
            require(game.playerStaked[game.players[i]], "Not all players staked");
        }

        // Verify winner is one of the players
        bool validWinner = false;
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] == winner) {
                validWinner = true;
                break;
            }
        }
        require(validWinner, "Invalid winner");

        // Verify signatures
        bytes32 domainSeparator = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );

        bytes32 structHash = keccak256(
            abi.encode(
                GAME_RESULT_TYPEHASH,
                gameId,
                keccak256(abi.encodePacked(game.players)),
                winner,
                keccak256(abi.encodePacked(scores)),
                serverNonce
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        // Verify all player signatures
        for (uint256 i = 0; i < game.players.length; i++) {
            require(
                digest.recover(signatures[i]) == game.players[i],
                "Invalid signature"
            );
        }

        // Settle - mark settled BEFORE transfer
        game.settled = true;
        uint256 totalPayout = game.totalStaked;

        // Transfer to winner
        (bool success, ) = payable(winner).call{value: totalPayout}("");
        require(success, "Payout failed");

        emit GameResult(gameId, winner, scores, totalPayout, serverNonce);
    }

    function cancelGame(bytes32 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.createdAt > 0, "Game does not exist");
        require(!game.settled, "Cannot cancel settled game");
        require(!game.canceled, "Already canceled");

        // Allow cancel if timeout (1 hour) and not all players staked
        require(
            block.timestamp > game.createdAt + 1 hours,
            "Too early to cancel"
        );

        game.canceled = true;

        // Refund all staked players
        for (uint256 i = 0; i < game.players.length; i++) {
            address player = game.players[i];
            if (game.playerStaked[player]) {
                uint256 refundAmount = game.playerStakes[player];
                if (refundAmount > 0) {
                    (bool success, ) = payable(player).call{value: refundAmount}("");
                    require(success, "Refund failed");
                }
            }
        }

        emit GameCanceled(gameId, "Timeout - not all players staked");
    }

    function setPoints(address player, uint256 total) external onlyOwner {
        points[player] = total;
        emit PointsUpdated(player, total);
    }

    // View functions
    function getGame(bytes32 gameId) external view returns (
        bytes32 gameId_,
        address[] memory players,
        uint256 stakeAmount,
        bool settled,
        bool canceled,
        uint256 createdAt,
        uint256 totalStaked
    ) {
        Game storage game = games[gameId];
        return (
            game.gameId,
            game.players,
            game.stakeAmount,
            game.settled,
            game.canceled,
            game.createdAt,
            game.totalStaked
        );
    }

    function isPlayerStaked(bytes32 gameId, address player) external view returns (bool) {
        return games[gameId].playerStaked[player];
    }

    function getPlayerStake(bytes32 gameId, address player) external view returns (uint256) {
        return games[gameId].playerStakes[player];
    }

    function getPoints(address player) external view returns (uint256) {
        return points[player];
    }
}
