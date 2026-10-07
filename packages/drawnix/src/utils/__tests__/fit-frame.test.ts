import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlaitBoard } from '@plait/core';
import { MIN_ZOOM, MAX_ZOOM } from '@plait/core';
import { fitRectInViewport } from '../fit-frame';

const mocks = vi.hoisted(() => ({
  updateViewport: vi.fn(),
}));

const CONTAINER_WIDTH = 390;
const CONTAINER_HEIGHT = 844;

vi.mock('@plait/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@plait/core')>();
  return {
    ...actual,
    // fitRectInViewport 只用这一个静态方法读容器尺寸
    PlaitBoard: {
      getBoardContainer: () => ({
        clientWidth: CONTAINER_WIDTH,
        clientHeight: CONTAINER_HEIGHT,
      }),
    },
    BoardTransforms: {
      ...actual.BoardTransforms,
      updateViewport: mocks.updateViewport,
    },
  };
});

const board = { children: [] } as unknown as PlaitBoard;

/** 用 updateViewport 收到的参数把世界坐标换算成屏幕坐标 */
function toScreen(worldX: number, worldY: number) {
  const [, origination, zoom] = mocks.updateViewport.mock.calls[0];
  return {
    x: (worldX - origination[0]) * zoom,
    y: (worldY - origination[1]) * zoom,
    zoom: zoom as number,
  };
}

function mountInputBar(height: number): void {
  const el = document.createElement('div');
  el.className = 'ai-input-bar';
  el.getBoundingClientRect = () => ({ height }) as DOMRect;
  document.body.appendChild(el);
}

describe('fitRectInViewport', () => {
  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('keeps a huge generated image fully inside the area left of the input bar', () => {
    mountInputBar(160);

    const fitted = fitRectInViewport(
      board,
      { x: 0, y: 0, width: 2048, height: 2048 },
      { maxZoom: 1 }
    );

    expect(fitted).toBe(true);
    expect(mocks.updateViewport).toHaveBeenCalledTimes(1);

    const topLeft = toScreen(0, 0);
    const bottomRight = toScreen(2048, 2048);

    expect(topLeft.zoom).toBeLessThanOrEqual(1);
    expect(topLeft.zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
    // 完整落在可见区内：左侧让开工具栏，底部让开输入栏，顶部让开顶部栏
    expect(topLeft.x).toBeGreaterThanOrEqual(0);
    expect(topLeft.y).toBeGreaterThanOrEqual(50);
    expect(bottomRight.x).toBeLessThanOrEqual(CONTAINER_WIDTH);
    expect(bottomRight.y).toBeLessThanOrEqual(CONTAINER_HEIGHT - 160);
  });

  it('never zooms past maxZoom', () => {
    mountInputBar(160);

    fitRectInViewport(board, { x: 0, y: 0, width: 10, height: 10 }, {
      maxZoom: 1,
    });

    expect(toScreen(0, 0).zoom).toBe(1);
  });

  it('sizes the fit against the measured input bar, not the 80px fallback', () => {
    mountInputBar(160);
    fitRectInViewport(board, { x: 0, y: 0, width: 200, height: 2000 });
    const withBar = toScreen(0, 0).zoom;

    // (844 - 50 顶部 - 160 输入栏 - 80 留白) / 2000
    expect(withBar).toBeCloseTo(554 / 2000, 6);

    document.body.innerHTML = '';
    mocks.updateViewport.mockClear();

    fitRectInViewport(board, { x: 0, y: 0, width: 200, height: 2000 });
    // 量不到输入栏时回退到 80：(844 - 50 - 80 - 80) / 2000
    expect(toScreen(0, 0).zoom).toBeCloseTo(634 / 2000, 6);
  });

  it('refuses to fit a degenerate rect', () => {
    expect(
      fitRectInViewport(board, { x: 0, y: 0, width: 0, height: 0 })
    ).toBe(false);
    expect(mocks.updateViewport).not.toHaveBeenCalled();
  });

  it('clamps the zoom to the patched lower bound', () => {
    mountInputBar(160);
    // 世界坐标 1e6 宽的元素 → 算出来远小于 MIN_ZOOM，必须被夹回
    fitRectInViewport(board, { x: 0, y: 0, width: 1e6, height: 1e6 });
    const { zoom } = toScreen(0, 0);
    expect(zoom).toBe(MIN_ZOOM);
    expect(MIN_ZOOM).toBeLessThan(0.1);
    expect(MAX_ZOOM).toBeGreaterThan(1);
  });
});
