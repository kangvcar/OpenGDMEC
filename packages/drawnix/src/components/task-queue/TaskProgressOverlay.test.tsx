// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { TaskStatus, TaskType } from '../../types/task.types';
import { TaskProgressOverlay } from './TaskProgressOverlay';

describe('TaskProgressOverlay', () => {
  beforeAll(() => {
    class ResizeObserverStub {
      observe = () => undefined;
      disconnect = () => undefined;
    }
    Object.defineProperty(globalThis, 'ResizeObserver', {
      configurable: true,
      value: ResizeObserverStub,
    });
  });

  afterEach(cleanup);

  it('renders generic video progress while the task is processing', () => {
    render(
      <TaskProgressOverlay
        taskType={TaskType.VIDEO}
        taskStatus={TaskStatus.PROCESSING}
        realProgress={20}
      />
    );

    expect(screen.getByText('生成中...')).not.toBeNull();
  });

  it('renders nothing for tasks that are not processing', () => {
    render(
      <TaskProgressOverlay
        taskType={TaskType.VIDEO}
        taskStatus={TaskStatus.PENDING}
        realProgress={10}
      />
    );

    expect(document.querySelector('.task-progress-overlay')).toBeNull();
  });
});
