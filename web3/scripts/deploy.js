const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying MatchEscrow contract...');
  
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', (await ethers.provider.getBalance(deployer.address)).toString());

  const MatchEscrow = await ethers.getContractFactory('MatchEscrow');
  const matchEscrow = await MatchEscrow.deploy();

  await matchEscrow.waitForDeployment();

  const address = await matchEscrow.getAddress();
  console.log('✅ MatchEscrow deployed to:', address);

  // Export ABI and address for client use
  const fs = require('fs');
  const path = require('path');

  const artifact = await hre.artifacts.readArtifact('MatchEscrow');
  const output = {
    address: address,
    abi: artifact.abi,
  };

  // Create services directory if it doesn't exist
  const servicesDir = path.join(__dirname, '../services');
  if (!fs.existsSync(servicesDir)) {
    fs.mkdirSync(servicesDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(servicesDir, 'MatchEscrow.json'),
    JSON.stringify(output, null, 2),
  );

  console.log('✅ Contract artifact saved to services/MatchEscrow.json');
  console.log('\n📝 Next steps:');
  console.log('1. Copy this address to server/.env → MATCH_ESCROW_ADDRESS=' + address);
  console.log('2. Copy this address to client/.env → VITE_MATCH_ESCROW_ADDRESS=' + address);
  console.log('3. Restart server and client');
  console.log('\n🔍 Verify on BaseScan: https://sepolia.basescan.org/address/' + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
