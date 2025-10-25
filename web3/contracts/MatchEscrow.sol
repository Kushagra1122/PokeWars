// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MatchEscrow is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;

    struct Match {
        address playerA;
        address playerB;
        uint256 stake;
        bool playerADeposited;
        bool playerBDeposited;
        bool settled;
        bool canceled;
        uint256 createdAt;
    }

    mapping(bytes32 => Match) public matches;
    mapping(address => uint256) public points;

    // EIP-712 domain separator
    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
    bytes32 private constant MATCH_RESULT_TYPEHASH =
        keccak256(
            "MatchResult(bytes32 matchId,address playerA,address playerB,address winner,uint256 scoreA,uint256 scoreB,uint256 serverNonce)"
        );

    string private constant NAME = "PokeWars MatchEscrow";
    string private constant VERSION = "1";

    event MatchCreated(
        bytes32 indexed matchId,
        address indexed playerA,
        address indexed playerB,
        uint256 stake
    );
    event MatchJoined(
        bytes32 indexed matchId,
        address indexed player,
        uint256 stake
    );
    event MatchResult(
        bytes32 indexed matchId,
        address indexed winner,
        uint256 scoreA,
        uint256 scoreB,
        uint256 totalPayout,
        uint256 serverNonce
    );
    event MatchCanceled(bytes32 indexed matchId, string reason);
    event PointsUpdated(address indexed player, uint256 totalPoints);

    constructor() Ownable(msg.sender) {}

    function createMatch(
        bytes32 matchId,
        address playerA,
        address playerB
    ) external payable nonReentrant {
        require(matches[matchId].playerA == address(0), "Match already exists");
        require(msg.value > 0, "Stake must be positive");
        require(msg.sender == playerA, "Only playerA can create");

        matches[matchId] = Match({
            playerA: playerA,
            playerB: playerB,
            stake: msg.value,
            playerADeposited: true,
            playerBDeposited: false,
            settled: false,
            canceled: false,
            createdAt: block.timestamp
        });

        emit MatchCreated(matchId, playerA, playerB, msg.value);
    }

    function joinMatch(bytes32 matchId) external payable nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.playerA != address(0), "Match does not exist");
        require(!match_.settled && !match_.canceled, "Match already resolved");
        require(msg.sender == match_.playerB, "Only playerB can join");
        require(msg.value == match_.stake, "Incorrect stake amount");
        require(!match_.playerBDeposited, "Already joined");

        match_.playerBDeposited = true;

        emit MatchJoined(matchId, msg.sender, msg.value);
    }

    function submitResult(
        bytes32 matchId,
        address winner,
        uint256 scoreA,
        uint256 scoreB,
        uint256 serverNonce,
        bytes memory sigA,
        bytes memory sigB
    ) external nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.playerA != address(0), "Match does not exist");
        require(
            match_.playerADeposited && match_.playerBDeposited,
            "Both players must deposit"
        );
        require(!match_.settled && !match_.canceled, "Match already resolved");
        require(
            winner == match_.playerA || winner == match_.playerB,
            "Invalid winner"
        );

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
                MATCH_RESULT_TYPEHASH,
                matchId,
                match_.playerA,
                match_.playerB,
                winner,
                scoreA,
                scoreB,
                serverNonce
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        require(
            digest.recover(sigA) == match_.playerA,
            "Invalid signature from playerA"
        );
        require(
            digest.recover(sigB) == match_.playerB,
            "Invalid signature from playerB"
        );

        // Settle - mark settled BEFORE transfer (checks-effects-interactions)
        match_.settled = true;
        uint256 totalPayout = match_.stake * 2;

        // Transfer to winner using call pattern
        (bool success, ) = payable(winner).call{value: totalPayout}("");
        require(success, "Payout failed");

        emit MatchResult(matchId, winner, scoreA, scoreB, totalPayout, serverNonce);
    }

    function cancelMatch(bytes32 matchId) external nonReentrant {
        Match storage match_ = matches[matchId];
        require(match_.playerA != address(0), "Match does not exist");
        require(!match_.settled, "Cannot cancel settled match");
        require(!match_.canceled, "Already canceled");

        string memory reason;

        // Allow cancel if only one player deposited and timeout (1 hour)
        if (match_.playerADeposited && !match_.playerBDeposited) {
            require(
                block.timestamp > match_.createdAt + 1 hours,
                "Too early to cancel"
            );
            match_.canceled = true;
            reason = "Timeout - playerB did not join";
            (bool success, ) = payable(match_.playerA).call{value: match_.stake}("");
            require(success, "Refund failed");
        } else if (match_.playerADeposited && match_.playerBDeposited) {
            // Both deposited, require both signatures (simplified: allow if called by playerA or playerB)
            require(
                msg.sender == match_.playerA || msg.sender == match_.playerB,
                "Unauthorized cancel"
            );
            match_.canceled = true;
            reason = "Mutual cancel";
            (bool successA, ) = payable(match_.playerA).call{value: match_.stake}("");
            require(successA, "Refund A failed");
            (bool successB, ) = payable(match_.playerB).call{value: match_.stake}("");
            require(successB, "Refund B failed");
        } else {
            revert("Invalid cancel state");
        }

        emit MatchCanceled(matchId, reason);
    }

    function setPoints(address player, uint256 total) external onlyOwner {
        points[player] = total;
        emit PointsUpdated(player, total);
    }

    // View functions
    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function getPoints(address player) external view returns (uint256) {
        return points[player];
    }
}
