const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

const OUTPUT_DIR = path.join(__dirname, "..", "deployments");
const OVERRIDES_PATH = path.join(__dirname, "..", "deploy-config.json");

const DEPLOYMENTS = [
  { name: "AddressBook", args: [] },
  { name: "ArraysExercise", args: [] },
  { name: "ControlStructures", args: [] },
  {
    name: "WeightedVoting",
    args: ["Weighted Voting Token", "WVT"]
  },
  { name: "HaikuNFT", args: [] },
  { name: "ErrorTriageExercise", args: [] },
  {
    name: "Salaried",
    args: [1, 101, 120000]
  },
  {
    name: "Hourly",
    args: [2, 101, 60]
  },
  { name: "FavoriteRecords", args: [] },
  { name: "UnburnableToken", args: [] },
  { name: "AddressBookFactory", args: [] },
  {
    name: "EmployeeStorage",
    args: [1000, "Alice", 120000, 1]
  },
  { name: "GarageManager", args: [] },
  { name: "BasicMath", args: [] },
  { name: "ImportsExercise", args: [] }
];

async function main() {
  let overrides = {};
  if (fs.existsSync(OVERRIDES_PATH)) {
    try {
      overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"));
      console.log("Loaded constructor argument overrides from deploy-config.json");
    } catch (error) {
      console.warn("[warn] Failed to parse deploy-config.json, using defaults.", error);
    }
  }

  if (!process.env.PRIVATE_KEY) {
    console.warn(
      "[warn] PRIVATE_KEY is not set. Using Hardhat's default accounts if available."
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with: ${deployer.address}`);
  console.log(`Network: ${network.name}`);

  const results = [];

  for (const config of DEPLOYMENTS) {
    const args = overrides?.[config.name] ?? config.args;
    console.log(`\nDeploying ${config.name}...`);
    if (args.length) {
      console.log(`  Using args: ${JSON.stringify(args)}`);
    }
    const factory = await ethers.getContractFactory(config.name);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const txHash = contract.deploymentTransaction()?.hash;

    console.log(`  Address: ${address}`);
    console.log(`  Tx Hash: ${txHash}`);

    results.push({
      name: config.name,
      address,
      txHash,
      args
    });
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = path.join(
    OUTPUT_DIR,
    `${network.name}-deployments.json`
  );

  const payload = {
    network: network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: results
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`\nSaved deployment data to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
