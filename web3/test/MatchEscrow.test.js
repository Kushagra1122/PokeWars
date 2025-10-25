const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('MatchEscrow', function () {
  let matchEscrow;
  let owner, playerA, playerB;

  beforeEach(async function () {
    [owner, playerA, playerB] = await ethers.getSigners();

    const MatchEscrow = await ethers.getContractFactory('MatchEscrow');
    matchEscrow = await MatchEscrow.deploy();
    await matchEscrow.waitForDeployment();
  });

  it('Should create a match', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-match'));
    const stake = ethers.parseEther('0.01');

    await expect(
      matchEscrow
        .connect(playerA)
        .createMatch(matchId, playerA.address, playerB.address, {
          value: stake,
        }),
    ).to.emit(matchEscrow, 'MatchCreated');

    const match = await matchEscrow.getMatch(matchId);
    expect(match.playerA).to.equal(playerA.address);
    expect(match.stake).to.equal(stake);
  });

  it('Should allow playerB to join', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-match'));
    const stake = ethers.parseEther('0.01');

    await matchEscrow
      .connect(playerA)
      .createMatch(matchId, playerA.address, playerB.address, { value: stake });
    await expect(
      matchEscrow.connect(playerB).joinMatch(matchId, { value: stake }),
    ).to.emit(matchEscrow, 'MatchJoined');

    const match = await matchEscrow.getMatch(matchId);
    expect(match.playerBDeposited).to.be.true;
  });

  it('Should settle match with signatures', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-match'));
    const stake = ethers.parseEther('0.01');

    // Create and join match
    await matchEscrow
      .connect(playerA)
      .createMatch(matchId, playerA.address, playerB.address, { value: stake });
    await matchEscrow.connect(playerB).joinMatch(matchId, { value: stake });

    // Create EIP-712 signatures
    const domain = {
      name: 'PokeWars MatchEscrow',
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await matchEscrow.getAddress(),
    };

    const types = {
      MatchResult: [
        { name: 'matchId', type: 'bytes32' },
        { name: 'playerA', type: 'address' },
        { name: 'playerB', type: 'address' },
        { name: 'winner', type: 'address' },
        { name: 'scoreA', type: 'uint256' },
        { name: 'scoreB', type: 'uint256' },
        { name: 'serverNonce', type: 'uint256' },
      ],
    };

    const value = {
      matchId: matchId,
      playerA: playerA.address,
      playerB: playerB.address,
      winner: playerA.address,
      scoreA: 100,
      scoreB: 50,
      serverNonce: 1,
    };

    const sigA = await playerA.signTypedData(domain, types, value);
    const sigB = await playerB.signTypedData(domain, types, value);

    const initialBalance = await ethers.provider.getBalance(playerA.address);

    await expect(
      matchEscrow.submitResult(
        matchId,
        playerA.address,
        100,
        50,
        1,
        sigA,
        sigB,
      ),
    ).to.emit(matchEscrow, 'MatchResult');

    const finalBalance = await ethers.provider.getBalance(playerA.address);
    expect(finalBalance - initialBalance).to.be.closeTo(
      stake * 2n,
      ethers.parseEther('0.001'),
    ); // Account for gas
  });

  it('Should revert on wrong winner', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-wrong-winner'));
    const stake = ethers.parseEther('0.01');

    await matchEscrow
      .connect(playerA)
      .createMatch(matchId, playerA.address, playerB.address, { value: stake });
    await matchEscrow.connect(playerB).joinMatch(matchId, { value: stake });

    const domain = {
      name: 'PokeWars MatchEscrow',
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await matchEscrow.getAddress(),
    };

    const types = {
      MatchResult: [
        { name: 'matchId', type: 'bytes32' },
        { name: 'playerA', type: 'address' },
        { name: 'playerB', type: 'address' },
        { name: 'winner', type: 'address' },
        { name: 'scoreA', type: 'uint256' },
        { name: 'scoreB', type: 'uint256' },
        { name: 'serverNonce', type: 'uint256' },
      ],
    };

    const value = {
      matchId: matchId,
      playerA: playerA.address,
      playerB: playerB.address,
      winner: owner.address, // Wrong winner - not a player
      scoreA: 100,
      scoreB: 50,
      serverNonce: 1,
    };

    const sigA = await playerA.signTypedData(domain, types, value);
    const sigB = await playerB.signTypedData(domain, types, value);

    await expect(
      matchEscrow.submitResult(matchId, owner.address, 100, 50, 1, sigA, sigB),
    ).to.be.revertedWith('Invalid winner');
  });

  it('Should revert on stake mismatch', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-stake-mismatch'));
    const stake = ethers.parseEther('0.01');

    await matchEscrow
      .connect(playerA)
      .createMatch(matchId, playerA.address, playerB.address, { value: stake });

    // PlayerB tries to join with wrong stake
    await expect(
      matchEscrow
        .connect(playerB)
        .joinMatch(matchId, { value: ethers.parseEther('0.02') }),
    ).to.be.revertedWith('Incorrect stake amount');
  });

  it('Should revert on zero stake', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-zero-stake'));

    await expect(
      matchEscrow
        .connect(playerA)
        .createMatch(matchId, playerA.address, playerB.address, { value: 0 }),
    ).to.be.revertedWith('Stake must be positive');
  });

  it('Should revert on double settlement', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-double-settle'));
    const stake = ethers.parseEther('0.01');

    await matchEscrow
      .connect(playerA)
      .createMatch(matchId, playerA.address, playerB.address, { value: stake });
    await matchEscrow.connect(playerB).joinMatch(matchId, { value: stake });

    const domain = {
      name: 'PokeWars MatchEscrow',
      version: '1',
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: await matchEscrow.getAddress(),
    };

    const types = {
      MatchResult: [
        { name: 'matchId', type: 'bytes32' },
        { name: 'playerA', type: 'address' },
        { name: 'playerB', type: 'address' },
        { name: 'winner', type: 'address' },
        { name: 'scoreA', type: 'uint256' },
        { name: 'scoreB', type: 'uint256' },
        { name: 'serverNonce', type: 'uint256' },
      ],
    };

    const value = {
      matchId: matchId,
      playerA: playerA.address,
      playerB: playerB.address,
      winner: playerA.address,
      scoreA: 100,
      scoreB: 50,
      serverNonce: 1,
    };

    const sigA = await playerA.signTypedData(domain, types, value);
    const sigB = await playerB.signTypedData(domain, types, value);

    // First settlement
    await matchEscrow.submitResult(matchId, playerA.address, 100, 50, 1, sigA, sigB);

    // Try second settlement
    await expect(
      matchEscrow.submitResult(matchId, playerA.address, 100, 50, 1, sigA, sigB),
    ).to.be.revertedWith('Match already resolved');
  });

  it('Should allow cancel after timeout', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-cancel-timeout'));
    const stake = ethers.parseEther('0.01');

    await matchEscrow
      .connect(playerA)
      .createMatch(matchId, playerA.address, playerB.address, { value: stake });

    // Fast forward 1 hour + 1 second
    await ethers.provider.send('evm_increaseTime', [3601]);
    await ethers.provider.send('evm_mine');

    // PlayerA should be able to cancel and get refund
    await expect(matchEscrow.connect(playerA).cancelMatch(matchId))
      .to.emit(matchEscrow, 'MatchCanceled')
      .withArgs(matchId, 'Timeout - playerB did not join');
  });

  it('Should allow mutual cancel', async function () {
    const matchId = ethers.keccak256(ethers.toUtf8Bytes('test-mutual-cancel'));
    const stake = ethers.parseEther('0.01');

    await matchEscrow
      .connect(playerA)
      .createMatch(matchId, playerA.address, playerB.address, { value: stake });
    await matchEscrow.connect(playerB).joinMatch(matchId, { value: stake });

    const initialBalanceA = await ethers.provider.getBalance(playerA.address);

    // Either player can cancel
    await matchEscrow.connect(playerA).cancelMatch(matchId);

    const finalBalanceA = await ethers.provider.getBalance(playerA.address);
    expect(finalBalanceA - initialBalanceA).to.be.closeTo(
      stake,
      ethers.parseEther('0.001'),
    );
  });
});
