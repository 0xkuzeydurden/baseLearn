import "./App.css";
import { useAccount, useChainId } from "wagmi";
import { ConnectPanel } from "@/components/Connect";
import { TaskGroup } from "@/components/TaskGroup";
import {
  contractGroups,
  allTasks,
  isTaskComplete,
  isTaskDeployed
} from "@/config/contracts";
import { useProgress } from "@/hooks/useProgress";

function App() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { progress, updateTask, clearTask, clearProfile } = useProgress(address, chainId);

  const deployedCount = allTasks.filter((task) =>
    isTaskDeployed(progress[task.id])
  ).length;
  const completedCount = allTasks.filter((task) =>
    isTaskComplete(task, progress[task.id])
  ).length;

  const hasProgress = Object.keys(progress).length > 0;

  return (
    <div className="app">
      <div className="credit-pill">
        Developed by{" "}
        <a href="https://x.com/islakwcterlii/" target="_blank" rel="noreferrer">
          Kuzey Durden
        </a>
      </div>
      <header className="hero">
        <div>
          <p className="eyebrow">Base Camp Learn</p>
          <h1>Deploy every exercise from a single dashboard</h1>
          <p className="lede">
            Connect your wallet, deploy each contract, submit the registry test transaction, and
            track every PIN without leaving this page. The UI consumes the Hardhat artifacts
            directly, so you always interact with the exact bytecode you compiled.
          </p>
        </div>
        <ConnectPanel />
      </header>

      <section className="summary-panel panel">
        <div className="stat">
          <p className="stat-value">{deployedCount}</p>
          <p className="stat-label">Contracts deployed</p>
        </div>
        <div className="stat">
          <p className="stat-value">{completedCount}</p>
          <p className="stat-label">Tasks with PINs claimed</p>
        </div>
        <div className="stat actions">
          <button
            className="btn ghost"
            type="button"
            disabled={!hasProgress}
            onClick={() => clearProfile()}
          >
            Clear local progress
          </button>
          <p className="stat-label subtle">
            Only cached addresses and tx hashes stored on this device will be removed.
          </p>
        </div>
      </section>

      {contractGroups.map((group) => (
        <TaskGroup
          key={group.id}
          group={group}
          progressMap={progress}
          chainId={chainId}
          onUpdateTask={updateTask}
          onClearTask={clearTask}
        />
      ))}
    </div>
  );
}

export default App;
