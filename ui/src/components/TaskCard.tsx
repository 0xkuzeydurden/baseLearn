import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getAddress } from "viem";
import clsx from "clsx";
import type { ContractTask, ConstructorField, TaskAction } from "@/config/contracts";
import { isTaskComplete } from "@/config/contracts";
import type { TaskProgress } from "@/types/progress";
import { registryAbi } from "@/lib/registry";
import {
  formatAddress,
  getExplorerAddressUrl,
  getExplorerTxUrl
} from "@/lib/explorer";

type TaskCardProps = {
  task: ContractTask;
  progress?: TaskProgress;
  profileProgress: Record<string, TaskProgress>;
  chainId?: number;
  onUpdate(payload: Partial<TaskProgress>): void;
  onClear(): void;
};

type FeedbackState = { type: "error" | "success"; message: string } | null;

export function TaskCard({
  task,
  progress,
  profileProgress,
  chainId,
  onUpdate,
  onClear
}: TaskCardProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [deploying, setDeploying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const normalizedDeployedAddress = useMemo(() => {
    try {
      return progress?.deployedAddress
        ? getAddress(progress.deployedAddress as string)
        : undefined;
    } catch {
      return undefined;
    }
  }, [progress?.deployedAddress]);

  const initialValues = useMemo(() => {
    const entries = (task.constructorInputs ?? []).map<[string, string]>((field) => [
      field.name,
      field.defaultValue ?? ""
    ]);
    return Object.fromEntries(entries);
  }, [task.constructorInputs]);

  const [formValues, setFormValues] = useState<Record<string, string>>(initialValues);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues, task.id]);

  useEffect(() => {
    if (!task.constructorInputs) return;
    setFormValues((prev) => {
      let next = prev;
      let changed = false;
      for (const field of task.constructorInputs ?? []) {
        if (!field.autoFillFromTask) continue;
        const depAddress =
          profileProgress[field.autoFillFromTask]?.deployedAddress ?? "";
        if (depAddress && prev[field.name] !== depAddress) {
          if (next === prev) {
            next = { ...prev };
          }
          next[field.name] = depAddress;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [profileProgress, task.constructorInputs]);

  const missingDependencies = useMemo(() => {
    if (!task.dependentTaskIds?.length) return [];
    return task.dependentTaskIds.filter(
      (depId) => !profileProgress[depId]?.deployedAddress
    );
  }, [profileProgress, task.dependentTaskIds]);

  const statusLabel = isTaskComplete(task, progress)
    ? "PIN claimed"
    : progress?.deployedAddress
      ? "Deployed"
      : "Not ready";

  const statusClass = isTaskComplete(task, progress)
    ? "success"
    : progress?.deployedAddress
      ? "warning"
      : "muted";

  const setFieldValue = (field: ConstructorField, value: string) => {
    setFormValues((prev) => ({ ...prev, [field.name]: value }));
  };

  const parseArgs = () => {
    if (!task.constructorInputs?.length) return [];
    return task.constructorInputs.map((field) => {
      const raw = formValues[field.name]?.trim();
      if (!raw) {
        throw new Error(`${field.label} cannot be empty.`);
      }
      switch (field.type) {
        case "string":
          return raw;
        case "address":
          if (!/^0x[a-fA-F0-9]{40}$/.test(raw)) {
            throw new Error(`${field.label} için geçerli bir adres yaz.`);
          }
          return raw as `0x${string}`;
        case "uint256": {
          const value = BigInt(raw);
          if (value < 0) {
            throw new Error(`${field.label} negatif olamaz.`);
          }
          return value;
        }
        case "int256":
          return BigInt(raw);
        default:
          return raw;
      }
    });
  };

  const ensureWalletReady = () => {
    if (!walletClient || !publicClient || !address) {
      throw new Error("Connect your wallet and select the correct network first.");
    }
  };

  const handleDeploy = async () => {
    try {
      ensureWalletReady();
      setDeploying(true);
      setFeedback(null);
      const args = parseArgs();
      const hash = await walletClient!.deployContract({
        abi: task.artifact.abi,
        bytecode: task.artifact.bytecode,
        args,
        account: walletClient!.account
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      if (!receipt.contractAddress) {
        throw new Error("Unable to read contract address from the receipt.");
      }
      const deployedAddress = getAddress(receipt.contractAddress);
      onUpdate({
        deployTx: hash,
        deployedAddress
      });
      setFeedback({
        type: "success",
        message: "Contract deployed successfully."
      });
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error) });
    } finally {
      setDeploying(false);
    }
  };

  const handleClaim = async () => {
    if (!task.registry) return;
    if (!normalizedDeployedAddress) {
      setFeedback({
        type: "error",
        message: "Deploy the contract and store the address first."
      });
      return;
    }
    try {
      ensureWalletReady();
      setClaiming(true);
      setFeedback(null);
      const hash = await walletClient!.writeContract({
        abi: registryAbi,
        address: task.registry,
        functionName: "testContract",
        args: [normalizedDeployedAddress],
        account: walletClient!.account,
        gas: task.registryGasLimit
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      onUpdate({ registryTx: hash });
      setFeedback({
        type: "success",
        message: "Registry test submitted. Verify it on Basescan."
      });
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error) });
    } finally {
      setClaiming(false);
    }
  };

  const explorerAddressUrl = getExplorerAddressUrl(chainId, progress?.deployedAddress);
  const explorerDeployTx = getExplorerTxUrl(chainId, progress?.deployTx);
  const explorerRegistryTx = getExplorerTxUrl(chainId, progress?.registryTx);

  const runPostDeployAction = async (action: TaskAction) => {
    if (!normalizedDeployedAddress) {
      setFeedback({
        type: "error",
        message: "Deploy the contract first."
      });
      return;
    }
    try {
      ensureWalletReady();
      setActionLoading(action.functionName);
      setFeedback(null);
      const hash = await walletClient!.writeContract({
        abi: task.artifact.abi,
        address: normalizedDeployedAddress,
        functionName: action.functionName as any,
        args: action.args ?? [],
        account: walletClient!.account
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      setFeedback({
        type: "success",
        message: `${action.label} transaction sent.`
      });
    } catch (error) {
      setFeedback({ type: "error", message: extractErrorMessage(error) });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={clsx("task-card", statusClass)}>
      <div className="task-card__header">
        <div>
          <h3>{task.title}</h3>
          <p className="task-summary">{task.summary}</p>
        </div>
        <span className={clsx("status-pill", statusClass)}>{statusLabel}</span>
      </div>

      {task.checklist && (
        <ul className="task-checklist">
          {task.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      {!!missingDependencies.length && (
        <div className="alert warning">
          {missingDependencies.length > 1 ? "Dependent contracts:" : "Dependent contract:"}{" "}
          {missingDependencies.join(", ")}. Deploy them first.
        </div>
      )}

      {task.constructorInputs?.length ? (
        <div className="constructor-grid">
          {task.constructorInputs.map((field) => (
            <label key={field.name} className="field">
              <span>{field.label}</span>
              <input
                type="text"
                value={formValues[field.name] ?? ""}
                placeholder={field.placeholder}
                onChange={(event) => setFieldValue(field, event.target.value)}
                disabled={deploying}
              />
              {field.helperText && <small>{field.helperText}</small>}
            </label>
          ))}
        </div>
      ) : null}

      {task.postDeployActions?.length ? (
        <div className="task-actions-panel">
          <p className="task-actions-title">Quick actions</p>
          {task.postDeployActions.map((action) => {
            const disabled =
              !normalizedDeployedAddress ||
              actionLoading === action.functionName ||
              deploying ||
              claiming ||
              Boolean(missingDependencies.length);
            return (
              <div className="task-action-row" key={action.functionName}>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={disabled}
                  onClick={() => runPostDeployAction(action)}
                >
                  {actionLoading === action.functionName ? "Sending…" : action.label}
                </button>
                {action.description && <small>{action.description}</small>}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="actions">
        <button
          type="button"
          className="btn primary"
          onClick={handleDeploy}
          disabled={deploying || missingDependencies.length > 0}
        >
          {deploying ? "Deploying…" : "Deploy"}
        </button>
        {task.registry && (
          <button
            type="button"
            className="btn secondary"
            onClick={handleClaim}
            disabled={claiming || !progress?.deployedAddress}
          >
            {claiming ? "Submitting…" : "Claim PIN"}
          </button>
        )}
        <button
          type="button"
          className="btn ghost"
          onClick={onClear}
          disabled={!progress}
        >
          Clear local record
        </button>
      </div>

      <div className="progress-block">
        <p>
          <span className="label">Contract address:</span>{" "}
          {progress?.deployedAddress ? (
            explorerAddressUrl ? (
              <a href={explorerAddressUrl} target="_blank" rel="noreferrer">
                {formatAddress(progress.deployedAddress)}
              </a>
            ) : (
              formatAddress(progress.deployedAddress)
            )
          ) : (
            "not available yet"
          )}
        </p>
        <p>
          <span className="label">Deploy tx:</span>{" "}
          {progress?.deployTx ? (
            explorerDeployTx ? (
              <a href={explorerDeployTx} target="_blank" rel="noreferrer">
                {formatAddress(progress.deployTx)}
              </a>
            ) : (
              formatAddress(progress.deployTx)
            )
          ) : (
            "not available yet"
          )}
        </p>
        {task.registry && (
          <p>
            <span className="label">Registry tx:</span>{" "}
            {progress?.registryTx ? (
              explorerRegistryTx ? (
                <a href={explorerRegistryTx} target="_blank" rel="noreferrer">
                  {formatAddress(progress.registryTx)}
                </a>
              ) : (
                formatAddress(progress.registryTx)
              )
            ) : (
              "not submitted"
            )}
          </p>
        )}
      </div>

      {feedback && (
        <p className={clsx("feedback", feedback.type === "error" ? "error-text" : "success-text")}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}

function extractErrorMessage(err: unknown) {
  if (!err) return "Bilinmeyen hata.";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  const nested =
    (err as any)?.shortMessage ||
    (err as any)?.info?.error?.message ||
    (err as any)?.message;
  return nested ?? "Transaction failed.";
}
