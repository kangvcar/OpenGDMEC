import { describe, expect, it } from 'vitest';
import { buildTourSteps, TOUR_TARGETS } from './tour-steps';

describe('buildTourSteps', () => {
  it('步骤顺序与锚点固定：开场 → 工具栏 → 输入栏 → 生成 → 任务队列 → 填 Key', () => {
    const steps = buildTourSteps({ hasCredentials: false });

    expect(steps).toHaveLength(6);
    // 第一步不带 element，driver.js 会把它居中当开场白；带了就会去找一个不存在的目标
    expect(steps[0].element).toBeUndefined();
    expect(steps.slice(1).map((step) => step.element)).toEqual([
      TOUR_TARGETS.toolbar,
      TOUR_TARGETS.promptBar,
      TOUR_TARGETS.send,
      TOUR_TARGETS.taskQueue,
      TOUR_TARGETS.adminKey,
    ]);
  });

  it('生成按钮那一步指向 ai-send-btn —— 老师最找不到的就是它', () => {
    const steps = buildTourSteps({ hasCredentials: true });

    expect(steps[3].element).toBe('[data-testid="ai-send-btn"]');
  });

  it('没配 Key 时末步给「去填 Key」这个动作，配了就只讲位置', () => {
    const withoutKey = buildTourSteps({ hasCredentials: false });
    const withKey = buildTourSteps({ hasCredentials: true });

    expect(withoutKey[5].popover?.doneBtnText).toBe('去填 Key');
    expect(withKey[5].popover?.doneBtnText).toBe('完成');
  });

  it('开场白自己定按钮组：此时「上一步」无处可去，给出来是个死按钮', () => {
    const steps = buildTourSteps({ hasCredentials: false });

    expect(steps[0].popover?.showButtons).toEqual(['next', 'close']);
    expect(steps[0].popover?.showProgress).toBe(false);
  });
});
