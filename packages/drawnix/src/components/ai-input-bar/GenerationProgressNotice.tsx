/**
 * 生成中状态行 —— 渲染在 AI 输入栏上方（AIInputComposerShell 的 notice 槽）。
 *
 * 手机上「提交完就看不到任何进度」：进度只画在画布锚点上，锚点可能被放到视口外，
 * 输入栏里只有发送按钮的 loading。这一行补上「在跑什么、跑到哪了」。
 *
 * 单独成组件是为了自己订阅任务队列 —— AIInputBar 有 7900 行，
 * 把 useTaskQueue 放进去会让每次进度 tick 重渲染整个输入栏。
 */
import React, { useEffect, useState } from 'react';
import { useTaskQueue } from '../../hooks/useTaskQueue';
import { TaskType } from '../../types/task.types';
import {
  getImageTaskProgressStatusText,
  resolveImageTaskDisplayProgress,
} from '../../utils/image-task-progress';

/** 任务类型的中文量词，用于「正在生成 2 张图片」 */
const TYPE_UNITS: Partial<Record<TaskType, string>> = {
  [TaskType.IMAGE]: '张图片',
  [TaskType.VIDEO]: '个视频',
  [TaskType.AUDIO]: '个音频',
  [TaskType.CHARACTER]: '个角色',
  [TaskType.INSPIRATION_BOARD]: '个灵感板',
  [TaskType.CHAT]: '段文本',
};

export const GenerationProgressNotice: React.FC = () => {
  const { activeTasks } = useTaskQueue();

  // 图片任务没有真实进度（task.progress 只有视频/音频在用），
  // 走和画布锚点同一套时间模拟进度，所以需要每秒重渲染一次把它推动起来。
  const hasImageTask = activeTasks.some((task) => task.type === TaskType.IMAGE);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!hasImageTask) return;

    const timer = setInterval(() => forceTick((tick) => tick + 1), 1000);
    return () => clearInterval(timer);
  }, [hasImageTask]);

  // 不能在 useMemo 里算：任务没更新时 activeTasks 的引用不变，
  // memo 会一直返回第一帧的百分比，数字看着就是死的。
  const counts = new Map<TaskType, number>();
  let progressSum = 0;
  let progressCount = 0;

  if (activeTasks.length === 0) return null;

  for (const task of activeTasks) {
    counts.set(task.type, (counts.get(task.type) ?? 0) + 1);

    const progress =
      task.type === TaskType.IMAGE
        ? resolveImageTaskDisplayProgress({
            startedAt: task.startedAt,
            fallbackProgress: task.progress,
          })
        : typeof task.progress === 'number'
          ? task.progress
          : null;

    if (typeof progress === 'number') {
      progressSum += progress;
      progressCount += 1;
    }
  }

  if (activeTasks.length === 0) return null;

  const label = `正在生成 ${Array.from(counts)
    .map(([type, count]) => `${count} ${TYPE_UNITS[type] ?? type}`)
    .join('、')}`;
  const percent =
    progressCount > 0 ? Math.round(progressSum / progressCount) : null;
  // 状态文案（分析提示词…/优化细节…）是给图片那套时间模拟进度写的，别的类型不出
  const statusText =
    percent !== null && hasImageTask
      ? getImageTaskProgressStatusText(percent)
      : null;

  return (
    <span className="ai-input-bar__progress-notice" role="status">
      <span className="ai-input-bar__progress-notice-label">{label}</span>
      {statusText && (
        <span className="ai-input-bar__progress-notice-status">{statusText}</span>
      )}
      {percent !== null && (
        <span className="ai-input-bar__progress-notice-percent">{percent}%</span>
      )}
    </span>
  );
};
