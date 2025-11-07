const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");

const OUTPUT_DIR = path.join(__dirname, "..", "deployments");
const CONFIG_PATH = path.join(__dirname, "..", "deploy-config.json");
const DEPLOY_FILE = (networkName) =>
  path.join(OUTPUT_DIR, `${networkName}-deploy-register.json`);
const TX_DELAY_MS = parseInt(process.env.DEPLOY_TX_DELAY_MS || "3000", 10);

const toChecksum = (address) => ethers.getAddress(address.toLowerCase());

const REGISTRATIONS = [
  { name: "BasicMath", args: [], registry: "0x075Eb9dc52177aA3492e1d26F0fde3D729625d2f" },
  {
    name: "EmployeeStorage",
    args: [1000, "Pat", 50000, 112358132134n],
    registry: "0x567452C6638C0d2D9778c20a3D59749fDcaa7aB3"
  },
  { name: "ControlStructures", args: [], registry: "0xF4d953a3976F392AA5509612Deff395983F22a84" },
  { name: "ArraysExercise", args: [], registry: "0x5B0f80cA6f5BD60cC3b64F0377f336B2b2A56cdf" },
  { name: "FavoriteRecords", args: [], registry: "0xD32E3aCe3272E2037003Ca54ca7E5676F9B8d06c" },
  { name: "GarageManager", args: [], registry: "0x9Eb1fA4cD9bd29ca2c8e72217a642811c1f6176d" },
  { name: "ErrorTriageExercise", args: [], registry: "0xC1bD0d9a8863F2318001bC5024c7F5f58A2236f7" },
  { name: "ImportsExercise", args: [], registry: "0x8Dd188Ec36084D59948F90213aFCD04429e33C0c" },
  {
    name: "HaikuNFT",
    args: [],
    registry: "0x15534ED3D1DbA55148695b2bA4164f147e47a10c",
    gasLimit: 1_800_000n
  },
  { name: "UnburnableToken", args: [], registry: "0x10cE928030E136ecc74D4a4416Db9B533E3C694d" },
  {
    name: "WeightedVoting",
    args: ["Weighted Voting Token", "WVT"],
    registry: "0x4F333c49B820013E5e6fE86634dC4DA88039cE50",
    gasLimit: 1_500_000n
  },
  { name: "AddressBook", args: [], registry: null },
  {
    name: "AddressBookFactory",
    args: [],
    registry: "0x4F21e69D0cDE8C21cF82a6b37dDA5444716AFA46",
    gasLimit: 1_200_000n
  },
  // Inheritance flow
  { name: "Salesperson", args: [55555, 12345, 20], registry: null },
  { name: "EngineeringManager", args: [54321, 11111, 200000], registry: null },
  { name: "Manager", args: [], registry: null },
  {
    name: "InheritanceSubmission",
    argsResolver: (ctx) => [ctx.getAddress("Salesperson"), ctx.getAddress("EngineeringManager")],
    registry: "0xF90dA05E77A33fE6D64bc2df84E7dD0069A2111c",
    gasLimit: 1_600_000n
  }
];

const REGISTRY_ABI = [
  "function testContract(address) external",
  "function owners(address) view returns (bool)"
];

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`Deployer: ${signer.address}`);
  console.log(`Network: ${network.name}`);

  const initialFeeData = await signer.provider.getFeeData();
  const DEFAULT_MAX_FEE =
    initialFeeData.maxFeePerGas != null
      ? (initialFeeData.maxFeePerGas * 12n) / 10n
      : ethers.parseUnits("1", "gwei");
  const DEFAULT_PRIORITY_FEE =
    initialFeeData.maxPriorityFeePerGas != null
      ? (initialFeeData.maxPriorityFeePerGas * 12n) / 10n
      : ethers.parseUnits("0.1", "gwei");
  const DEFAULT_GAS_PRICE =
    initialFeeData.gasPrice != null
      ? (initialFeeData.gasPrice * 12n) / 10n
      : ethers.parseUnits("1", "gwei");
  const FEE_BUMP = ethers.parseUnits("1", "gwei");

  async function buildFeeOverrides(extra = {}) {
    const data = await signer.provider.getFeeData();
    if (data.maxFeePerGas != null && data.maxPriorityFeePerGas != null) {
      const maxFee = data.maxFeePerGas + FEE_BUMP;
      const priority = data.maxPriorityFeePerGas + FEE_BUMP;
      return {
        maxFeePerGas: maxFee,
        maxPriorityFeePerGas: priority,
        ...extra
      };
    }

    if (data.maxFeePerGas != null) {
      return {
        maxFeePerGas: data.maxFeePerGas + FEE_BUMP,
        maxPriorityFeePerGas: DEFAULT_PRIORITY_FEE + FEE_BUMP,
        ...extra
      };
    }

    return {
      gasPrice: (data.gasPrice || DEFAULT_GAS_PRICE) + FEE_BUMP,
      ...extra
    };
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const delay = async () => {
    if (TX_DELAY_MS > 0) {
      await new Promise((resolve) => setTimeout(resolve, TX_DELAY_MS));
    }
  };

  const deploymentFile = DEPLOY_FILE(network.name);
  const previous = {};
  if (fs.existsSync(deploymentFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
      for (const entry of parsed.contracts || []) {
        if (entry.deployedAddress) {
          previous[entry.contractName || entry.name] = entry.deployedAddress;
        }
      }
    } catch (err) {
      console.warn(
        `[warn] Failed to load previous deployments from ${deploymentFile}: ${err.message}`
      );
    }
  }

  const deployed = {};
  const results = [];

  let overrides = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      overrides = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      console.log("Loaded constructor overrides from deploy-config.json");
    } catch (err) {
      console.warn(
        `[warn] Failed to parse deploy-config.json: ${err.message}. Using defaults.`
      );
    }
  }

  const ctx = {
    getAddress: (name) => {
      const found = deployed[name] || previous[name];
      if (!found) {
        throw new Error(`Dependency address for "${name}" not found.`);
      }
      return found;
    },
    signer,
    previous: (name) => previous[name],
    resolveOverrideArgs: (arr = []) =>
      arr.map((value) => {
        if (typeof value === "string" && value.startsWith("$")) {
          return ctx.getAddress(value.slice(1));
        }
        if (typeof value === "string" && /^[0-9]+n?$/.test(value)) {
          return value.endsWith("n")
            ? BigInt(value.slice(0, -1))
            : BigInt(value);
        }
        return value;
      })
  };

  for (const item of REGISTRATIONS) {
    const registryAddress = item.registry ? toChecksum(item.registry) : undefined;
    const registry = registryAddress
      ? new ethers.Contract(registryAddress, REGISTRY_ABI, signer)
      : null;

    let alreadyRegistered = false;
    if (registry) {
      try {
        if (registry.owners) {
          alreadyRegistered = await registry.owners(signer.address);
        }
      } catch {
        alreadyRegistered = false;
      }
    }

    if (alreadyRegistered) {
      console.log(`\n${item.name}: already registered, skipping deploy and test.`);
      const knownAddress = previous[item.name] || null;
      deployed[item.name] = knownAddress;
      results.push({
        contractName: item.name,
        deployedAddress: knownAddress,
        registry: registryAddress,
        txHash: "already-registered"
      });
      continue;
    }

    console.log(`\nDeploying ${item.name}...`);

    const overrideArgs = overrides[item.name];
    const args =
      overrideArgs !== undefined
        ? ctx.resolveOverrideArgs(overrideArgs)
        :
      typeof item.argsResolver === "function"
        ? await item.argsResolver(ctx)
        : item.args || [];

    const factory = await ethers.getContractFactory(item.name);
    const deployOverrides = await buildFeeOverrides();
    const contract = await factory.deploy(...args, deployOverrides);
    await contract.waitForDeployment();
    await delay();
    const deployedAddress = await contract.getAddress();

    console.log(`  -> Address: ${deployedAddress}`);
    deployed[item.name] = deployedAddress;

    if (registry) {
      try {
        const callOverrides = await buildFeeOverrides({
          gasLimit: item.gasLimit || 900000n
        });
        const tx = await registry.testContract(deployedAddress, callOverrides);
        const receipt = await tx.wait();
        await delay();

        console.log(`  -> testContract tx: ${receipt.hash}`);

        results.push({
          contractName: item.name,
          deployedAddress,
          registry: registryAddress,
          txHash: receipt.hash
        });
      } catch (txErr) {
        const reason =
          txErr?.info?.error?.message ??
          txErr?.error?.message ??
          txErr?.reason ??
          txErr?.shortMessage ??
          txErr?.message;
        console.error(`  -> transaction revert: ${reason}`);
        throw txErr;
      }
    } else {
      results.push({
        contractName: item.name,
        deployedAddress,
        registry: null,
        txHash: "not-applicable"
      });
    }
  }

  const payload = {
    network: network.name,
    deployedAt: new Date().toISOString(),
    deployer: signer.address,
    contracts: results
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(payload, null, 2));
  console.log(`\nSaved deployment report to ${deploymentFile}`);

  console.log("\n=== Summary ===");
  for (const entry of results) {
    console.log(
      `${entry.contractName} -> ${entry.deployedAddress} | registry: ${entry.registry} | tx: ${entry.txHash}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
