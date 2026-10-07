import { describe, expect, it } from 'vitest';
import {
  advanceTap,
  INITIAL_TAP_STATE,
  TAP_COUNT,
  TAP_WINDOW_MS,
  type TapState,
} from './menu-version-row';

/** 连点 n 次，每次间隔 gap 毫秒，返回最终状态与是否触发过 */
function tapTimes(
  times: number,
  gap: number,
  start: TapState = INITIAL_TAP_STATE,
  startAt = 0
) {
  let state = start;
  let triggered = false;
  let now = startAt;
  for (let i = 0; i < times; i++) {
    now += gap;
    const result = advanceTap(state, now);
    state = result.state;
    triggered = triggered || result.triggered;
  }
  return { state, triggered, now };
}

describe('菜单版本行连点手势', () => {
  it('窗口内连点 5 次触发', () => {
    const { triggered, state } = tapTimes(TAP_COUNT, 100);
    expect(triggered).toBe(true);
    // 命中后必须归零，否则下一次点击会立刻再触发
    expect(state.count).toBe(0);
  });

  it('只点 4 次不触发', () => {
    const { triggered, state } = tapTimes(TAP_COUNT - 1, 100);
    expect(triggered).toBe(false);
    expect(state.count).toBe(TAP_COUNT - 1);
  });

  it('点 4 次后停顿超过窗口，第 5 次重新计数', () => {
    const first = tapTimes(TAP_COUNT - 1, 100);
    const { triggered, state } = tapTimes(
      1,
      100,
      first.state,
      first.now + TAP_WINDOW_MS + 1
    );
    expect(triggered).toBe(false);
    expect(state.count).toBe(1);
  });

  it('每两次之间都超窗时永远不触发', () => {
    const { triggered, state } = tapTimes(TAP_COUNT + 3, TAP_WINDOW_MS + 1);
    expect(triggered).toBe(false);
    expect(state.count).toBe(1);
  });

  it('触发后重新计数，不会连续触发', () => {
    const first = tapTimes(TAP_COUNT, 100);
    expect(first.triggered).toBe(true);
    const { triggered } = tapTimes(1, 100, first.state, first.now + 100);
    expect(triggered).toBe(false);
  });
});
