import { getAddress, type Abi } from "viem";
import type { TaskProgress } from "@/types/progress";

import BasicMathArtifact from "#artifacts/contracts/DeployingOnTestnet.sol/BasicMath.json";
import EmployeeStorageArtifact from "#artifacts/contracts/Storage.sol/EmployeeStorage.json";
import ControlStructuresArtifact from "#artifacts/contracts/ControlStructures.sol/ControlStructures.json";
import ArraysExerciseArtifact from "#artifacts/contracts/Arrays.sol/ArraysExercise.json";
import FavoriteRecordsArtifact from "#artifacts/contracts/Mapping.sol/FavoriteRecords.json";
import GarageManagerArtifact from "#artifacts/contracts/Structs.sol/GarageManager.json";
import ErrorTriageExerciseArtifact from "#artifacts/contracts/Errors.sol/ErrorTriageExercise.json";
import ImportsExerciseArtifact from "#artifacts/contracts/Imports.sol/ImportsExercise.json";
import HaikuNFTArtifact from "#artifacts/contracts/ERC721.sol/HaikuNFT.json";
import UnburnableTokenArtifact from "#artifacts/contracts/MinimalTokenExercise.sol/UnburnableToken.json";
import WeightedVotingArtifact from "#artifacts/contracts/ERC20.sol/WeightedVoting.json";
import AddressBookArtifact from "#artifacts/contracts/AddressBook.sol/AddressBook.json";
import AddressBookFactoryArtifact from "#artifacts/contracts/OtherContract.sol/AddressBookFactory.json";
import SalespersonArtifact from "#artifacts/contracts/Inheritance.sol/Salesperson.json";
import EngineeringManagerArtifact from "#artifacts/contracts/Inheritance.sol/EngineeringManager.json";
import ManagerArtifact from "#artifacts/contracts/Inheritance.sol/Manager.json";
import InheritanceSubmissionArtifact from "#artifacts/contracts/Inheritance.sol/InheritanceSubmission.json";

type HardhatArtifact = {
  abi: Abi;
  bytecode: string;
};

const toArtifact = (artifact: HardhatArtifact) => ({
  abi: artifact.abi as Abi,
  bytecode: artifact.bytecode as `0x${string}`
});

const checksum = (value: string) => getAddress(value) as `0x${string}`;

export type ModuleId = "warmup" | "newcomer" | "acolyte" | "prefect" | "supreme";

export type ArgInputType = "string" | "uint256" | "int256" | "address";

export type ConstructorField = {
  name: string;
  label: string;
  type: ArgInputType;
  placeholder?: string;
  defaultValue?: string;
  helperText?: string;
  autoFillFromTask?: string;
};

export type ContractTask = {
  id: string;
  title: string;
  module: ModuleId;
  summary: string;
  artifact: {
    abi: Abi;
    bytecode: `0x${string}`;
  };
  registry?: `0x${string}`;
  registryGasLimit?: bigint;
  constructorInputs?: ConstructorField[];
  checklist?: string[];
  links?: { label: string; href: string }[];
  dependentTaskIds?: string[];
  postDeployActions?: TaskAction[];
};

export type TaskAction = {
  label: string;
  functionName: string;
  description?: string;
  args?: readonly unknown[];
};

export type ContractGroup = {
  id: ModuleId;
  title: string;
  description: string;
  tasks: ContractTask[];
};

const TASKS: ContractTask[] = [
  {
    id: "BasicMath",
    title: "BasicMath",
    module: "warmup",
    summary:
      "Simple overflow/underflow helpers used by Base to confirm you can deploy to the right network.",
    artifact: toArtifact(BasicMathArtifact as HardhatArtifact),
    registry: checksum("0x075Eb9dc52177aA3492e1d26F0fde3D729625d2f"),
    checklist: [
      "Deploy on Base/Base Sepolia.",
      "Keep the address + tx hash handy for the Base Camp Learn form."
    ]
  },
  {
    id: "EmployeeStorage",
    title: "EmployeeStorage",
    module: "warmup",
    summary:
      "Stores an employee profile with packed storage variables. Base reviews your constructor inputs.",
    artifact: toArtifact(EmployeeStorageArtifact as HardhatArtifact),
    registry: checksum("0x567452C6638C0d2D9778c20a3D59749fDcaa7aB3"),
    constructorInputs: [
      {
        name: "_shares",
        label: "Shares (uint16)",
        type: "uint256",
        defaultValue: "1000",
        helperText: "Use ≤5000 to avoid the TooManyShares error."
      },
      {
        name: "_name",
        label: "Name",
        type: "string",
        defaultValue: "Pat"
      },
      {
        name: "_salary",
        label: "Monthly salary (uint32)",
        type: "uint256",
        defaultValue: "50000"
      },
      {
        name: "_idNumber",
        label: "Employee ID",
        type: "uint256",
        defaultValue: "112358132134"
      }
    ],
    checklist: [
      "Deploy with the constructor arguments expected by the registry.",
      "Use the Claim PIN action right after deployment (before modifying state)."
    ]
  },
  {
    id: "ArraysExercise",
    title: "ArraysExercise",
    module: "newcomer",
    summary:
      "The classic array manipulation kata where you append numbers and filter timestamps.",
    artifact: toArtifact(ArraysExerciseArtifact as HardhatArtifact),
    registry: checksum("0x5B0f80cA6f5BD60cC3b64F0377f336B2b2A56cdf"),
    checklist: [
      "Deploy, then interact with `appendToNumbers` / `saveTimestamp` to capture proofs.",
      "Submit with the Claim PIN button to record your wallet with the Base registry."
    ]
  },
  {
    id: "FavoriteRecords",
    title: "FavoriteRecords",
    module: "newcomer",
    summary:
      "Manage an allowlisted set of albums and mark your personal favorites.",
    artifact: toArtifact(FavoriteRecordsArtifact as HardhatArtifact),
    registry: checksum("0xD32E3aCe3272E2037003Ca54ca7E5676F9B8d06c"),
    checklist: [
      "Deploy, call `addRecord`, and save a screenshot for your submission.",
      "Claim the PIN to prove ownership."
    ]
  },
  {
    id: "GarageManager",
    title: "GarageManager",
    module: "newcomer",
    summary: "Struct-heavy contract for tracking cars per wallet.",
    artifact: toArtifact(GarageManagerArtifact as HardhatArtifact),
    registry: checksum("0x9Eb1fA4cD9bd29ca2c8e72217a642811c1F6176d"),
    checklist: [
      "Deploy and add at least one car via `addCar`.",
      "Run the PIN claim to finish the Newcomer checklist."
    ]
  },
  {
    id: "ControlStructures",
    title: "ControlStructures",
    module: "acolyte",
    summary:
      "FizzBuzz & working-hour logic with revert reasons checked by Base.",
    artifact: toArtifact(ControlStructuresArtifact as HardhatArtifact),
    registry: checksum("0xF4d953a3976F392AA5509612Deff395983F22a84"),
    checklist: [
      "Deploy and test `fizzBuzz` / `doNotDisturb` locally.",
      "Submit to the registry to advance toward the Acolyte badge."
    ]
  },
  {
    id: "ErrorTriageExercise",
    title: "ErrorTriageExercise",
    module: "acolyte",
    summary:
      "Diff-with-neighbor plus stateful array mutations that Base inspects when you submit.",
    artifact: toArtifact(ErrorTriageExerciseArtifact as HardhatArtifact),
    registry: checksum("0xC1bD0d9a8863F2318001bC5024c7F5f58A2236f7"),
    checklist: [
      "Deploy, push a few numbers with `addToArr`, and capture screenshots.",
      "Claim the PIN so the registry logs your deployment."
    ]
  },
  {
    id: "WeightedVoting",
    title: "WeightedVoting",
    module: "prefect",
    summary:
      "ERC20-based voting token where each holder’s weight counts toward quorum.",
    artifact: toArtifact(WeightedVotingArtifact as HardhatArtifact),
    registry: checksum("0x4F333c49B820013E5e6Fe86634DC4Da88039CE50"),
    registryGasLimit: 1_500_000n,
    constructorInputs: [
      {
        name: "_name",
        label: "Token name",
        type: "string",
        defaultValue: "Weighted Voting Token"
      },
      {
        name: "_symbol",
        label: "Token symbol",
        type: "string",
        defaultValue: "WVT"
      }
    ],
    checklist: [
      "Deploy, `claim` some tokens, and open at least one issue.",
      "Use Claim PIN so Base can run `testContract` (it mints your Prefect PIN)."
    ],
    postDeployActions: [
      {
        label: "Token claim et",
        functionName: "claim",
        description: "Registry testinden önce kendi cüzdanına 100 WVT mintler."
      }
    ]
  },
  {
    id: "UnburnableToken",
    title: "UnburnableToken",
    module: "prefect",
    summary:
      "Minimal token with a one-time claim and guarded transfer logic used for Prefect submissions.",
    artifact: toArtifact(UnburnableTokenArtifact as HardhatArtifact),
    registry: checksum("0x10cE928030E136ecc74D4a4416Db9B533E3C694d"),
    checklist: [
      "Deploy and call `claim` once to log your balance.",
      "Submit via Claim PIN right after deployment."
    ]
  },
  {
    id: "HaikuNFT",
    title: "HaikuNFT",
    module: "supreme",
    summary:
      "ERC-721 that ensures every haiku line is unique before minting. Required for the Supreme badge.",
    artifact: toArtifact(HaikuNFTArtifact as HardhatArtifact),
    registry: checksum("0x15534ED3D1DbA55148695b2bA4164f147E47a10c"),
    registryGasLimit: 1_800_000n,
    checklist: [
      "Deploy, mint at least one haiku (all three lines must be unique globally).",
      "Share a haiku with another wallet and keep that tx hash for the form."
    ]
  },
  {
    id: "ImportsExercise",
    title: "ImportsExercise",
    module: "supreme",
    summary:
      "Stores a haiku struct via the SillyStringUtils library and appends shrug emojis.",
    artifact: toArtifact(ImportsExerciseArtifact as HardhatArtifact),
    registry: checksum("0x8Dd188Ec36084D59948F90213aFCD04429E33c0c"),
    checklist: [
      "Deploy and run both `saveHaiku` and `shruggieHaiku` to prove functionality.",
      "Claim the PIN directly from this UI."
    ]
  },
  {
    id: "AddressBook",
    title: "AddressBook",
    module: "supreme",
    summary:
      "Ownable contact manager. You’ll import it into the factory and demonstrate CRUD functions.",
    artifact: toArtifact(AddressBookArtifact as HardhatArtifact),
    checklist: [
      "Deploy and note the owner address. Use it with AddressBookFactory deployments.",
      "Add/delete contacts to prepare screenshots for Base."
    ]
  },
  {
    id: "AddressBookFactory",
    title: "AddressBookFactory",
    module: "supreme",
    summary:
      "Deploys new AddressBooks and transfers ownership to the caller. Base checks that ownership swap.",
    artifact: toArtifact(AddressBookFactoryArtifact as HardhatArtifact),
    registry: checksum("0x4F21e69D0cDE8C21cF82a6b37Dda5444716AFA46"),
    registryGasLimit: 1_200_000n,
    checklist: [
      "Deploy the factory, run `deploy()` once, and confirm you own the new AddressBook.",
      "Claim the PIN so the registry can see the emitted events."
    ],
    dependentTaskIds: ["AddressBook"]
  },
  {
    id: "Salesperson",
    title: "Salesperson",
    module: "supreme",
    summary:
      "Hourly employee derived from the inheritance tree. Use these addresses when you wire up the submission contract.",
    artifact: toArtifact(SalespersonArtifact as HardhatArtifact),
    constructorInputs: [
      {
        name: "_idNumber",
        label: "Employee ID",
        type: "uint256",
        defaultValue: "55555"
      },
      {
        name: "_managerId",
        label: "Manager ID",
        type: "uint256",
        defaultValue: "12345"
      },
      {
        name: "_hourlyRate",
        label: "Hourly rate",
        type: "uint256",
        defaultValue: "20"
      }
    ],
    checklist: [
      "Deploy and keep the resulting address for InheritanceSubmission.",
      "No registry step—just ensure you don’t lose the address."
    ]
  },
  {
    id: "EngineeringManager",
    title: "EngineeringManager",
    module: "supreme",
    summary:
      "Salaried manager contract plus the Manager mixin. Acts as the second dependency for the submission tester.",
    artifact: toArtifact(EngineeringManagerArtifact as HardhatArtifact),
    constructorInputs: [
      {
        name: "_idNumber",
        label: "Employee ID",
        type: "uint256",
        defaultValue: "54321"
      },
      {
        name: "_managerId",
        label: "Manager ID",
        type: "uint256",
        defaultValue: "11111"
      },
      {
        name: "_annualSalary",
        label: "Annual salary",
        type: "uint256",
        defaultValue: "200000"
      }
    ],
    checklist: [
      "Deploy, then feed the address into the submission contract below.",
      "Again, no registry. Just store the address safely."
    ]
  },
  {
    id: "Manager",
    title: "Manager",
    module: "supreme",
    summary:
      "Utility contract for resetting and adding employee reports—Base references it when reviewing your inheritance layout.",
    artifact: toArtifact(ManagerArtifact as HardhatArtifact),
    checklist: [
      "Deploy and tie it to your EngineeringManager if you want extra screenshots.",
      "Not required by a registry, but good to have on hand."
    ]
  },
  {
    id: "InheritanceSubmission",
    title: "InheritanceSubmission",
    module: "supreme",
    summary:
      "Final Supreme contract that wires together your Salesperson and EngineeringManager deployments.",
    artifact: toArtifact(InheritanceSubmissionArtifact as HardhatArtifact),
    registry: checksum("0xF90dA05E77A33fE6D64bc2Df84E7dD0069A2111c"),
    registryGasLimit: 1_600_000n,
    constructorInputs: [
      {
        name: "_salesPerson",
        label: "Salesperson address",
        type: "address",
        placeholder: "0x...",
        autoFillFromTask: "Salesperson",
        helperText: "Automatically pulls from the Salesperson card once deployed."
      },
      {
        name: "_engineeringManager",
        label: "EngineeringManager address",
        type: "address",
        placeholder: "0x...",
        autoFillFromTask: "EngineeringManager",
        helperText: "Uses the deployment address captured above."
      }
    ],
    checklist: [
      "Deploy after both dependency contracts are live.",
      "Claim the PIN to finish the Base Learn Supreme module."
    ],
    dependentTaskIds: ["Salesperson", "EngineeringManager"]
  }
];

const GROUP_METADATA: { id: ModuleId; title: string; description: string }[] = [
  {
    id: "warmup",
    title: "Kickoff",
    description:
      "Prove you can deploy to Base/Base Sepolia and capture constructor inputs correctly."
  },
  {
    id: "newcomer",
    title: "Newcomer Badge",
    description:
      "Arrays, mappings, and structs—the first Base Learn checkpoint."
  },
  {
    id: "acolyte",
    title: "Acolyte Badge",
    description: "Control flow and error handling with registry verification."
  },
  {
    id: "prefect",
    title: "Prefect Badge",
    description:
      "Token mechanics plus voting/quorum exercises for the on-chain interview."
  },
  {
    id: "supreme",
    title: "Supreme Badge",
    description:
      "NFTs, imports, factories, and the full inheritance flow all wrapped together."
  }
];

export const contractGroups: ContractGroup[] = GROUP_METADATA.map((group) => ({
  ...group,
  tasks: TASKS.filter((task) => task.module === group.id)
}));

export const allTasks = TASKS;

export const contractTaskMap = new Map<string, ContractTask>(
  TASKS.map((task) => [task.id, task])
);

export function isTaskDeployed(progress?: TaskProgress) {
  return Boolean(progress?.deployedAddress);
}

export function isTaskComplete(task: ContractTask, progress?: TaskProgress) {
  if (!progress) return false;
  return task.registry ? Boolean(progress.registryTx) : isTaskDeployed(progress);
}
