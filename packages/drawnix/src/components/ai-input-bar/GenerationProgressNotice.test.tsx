// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskStatus, TaskType } from '../../types/task.types';
import type { Task } from '../../types/task.types';
import { GenerationProgressNotice } from './GenerationProgressNotice';

const { useTaskQueueMock } = vi.hoisted(() => ({
  useTaskQueueMock: vi.fn(),
}));

vi.mock('../../hooks/useTaskQueue', () => ({
  useTaskQueue: () => useTaskQueueMock(),
}));

const makeTask = (overrides: Partial<Task> = {}): Task =>
  ({
    id: 'task-1',
    type: TaskType.IMAGE,
    status: TaskStatus.PROCESSING,
    params: { prompt: '一只猫' },
    createdAt: 0,
    updatedAt: 0,
    startedAt: Date.now(),
    ...overrides,
  }) as Task;

describe('GenerationProgressNotice', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders nothing without active tasks', () => {
    useTaskQueueMock.mockReturnValue({ activeTasks: [] });
    const { container } = render(<GenerationProgressNotice />);
    expect(container.innerHTML).toBe('');
  });

  it('shows what is running and a moving percentage', () => {
    const startedAt = Date.now();
    useTaskQueueMock.mockReturnValue({
      activeTasks: [makeTask({ startedAt }), makeTask({ id: 'task-2' })],
    });
    render(<GenerationProgressNotice />);

    expect(screen.getByRole('status').textContent).toContain('正在生成 2 张图片');
    expect(screen.getByRole('status').textContent).toMatch(/分析提示词/);
  });

  it('uses the real progress reported by video tasks', () => {
    useTaskQueueMock.mockReturnValue({
      activeTasks: [
        makeTask({ type: TaskType.VIDEO, progress: 80, startedAt: undefined }),
      ],
    });
    render(<GenerationProgressNotice />);

    expect(screen.getByRole('status').textContent).toContain('1 个视频');
    expect(screen.getByRole('status').textContent).toContain('80%');
  });

  it('derives the percentage from elapsed time so the number moves', () => {
    const start = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(start);
    useTaskQueueMock.mockReturnValue({
      activeTasks: [makeTask({ startedAt: start })],
    });
    const view = render(<GenerationProgressNotice />);
    const first = screen.getByRole('status').textContent;

    // 图片没有真实进度：进度必须按经过时间算出来，否则数字永远停在 0%
    vi.setSystemTime(start + 120000);
    view.rerender(<GenerationProgressNotice />);

    expect(first).toContain('0%');
    expect(screen.getByRole('status').textContent).toContain('70%');
  });

  it('keeps a ticking timer only while an image task is running', () => {
    vi.useFakeTimers();
    useTaskQueueMock.mockReturnValue({
      activeTasks: [makeTask({ startedAt: Date.now() })],
    });
    const view = render(<GenerationProgressNotice />);
    expect(vi.getTimerCount()).toBe(1);

    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
