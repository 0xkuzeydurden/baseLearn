import type { ContractGroup } from "@/config/contracts";
import { isTaskComplete } from "@/config/contracts";
import type { TaskProgress } from "@/types/progress";
import { TaskCard } from "@/components/TaskCard";

type TaskGroupProps = {
  group: ContractGroup;
  progressMap: Record<string, TaskProgress>;
  chainId?: number;
  onUpdateTask(id: string, payload: Partial<TaskProgress>): void;
  onClearTask(id: string): void;
};

export function TaskGroup({
  group,
  progressMap,
  chainId,
  onUpdateTask,
  onClearTask
}: TaskGroupProps) {
  const completed = group.tasks.filter((task) =>
    isTaskComplete(task, progressMap[task.id])
  ).length;

  return (
    <section className="task-group">
      <div className="task-group__header">
        <div>
          <h2>{group.title}</h2>
          <p>{group.description}</p>
        </div>
        <span className="badge">
          {completed}/{group.tasks.length} tasks complete
        </span>
      </div>
      <div className="task-grid">
        {group.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            progress={progressMap[task.id]}
            profileProgress={progressMap}
            chainId={chainId}
            onUpdate={(payload) => onUpdateTask(task.id, payload)}
            onClear={() => onClearTask(task.id)}
          />
        ))}
      </div>
    </section>
  );
}
