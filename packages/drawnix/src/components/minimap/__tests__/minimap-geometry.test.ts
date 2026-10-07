import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlaitBoard } from '@plait/core';
import {
  getCanvasPointerPoint,
  getOriginationForVisibleCenter,
  getVisibleViewportBox,
} from '../minimap-geometry';

const CONTAINER_WIDTH = 390;
const CONTAINER_HEIGHT = 844;
const TOOLBAR_RIGHT = 58;
const INPUT_BAR_HEIGHT = 160;

vi.mock('@plait/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@plait/core')>();
  return {
    ...actual,
    PlaitBoard: {
      getBoardContainer: () => ({
        clientWidth: CONTAINER_WIDTH,
        clientHeight: CONTAINER_HEIGHT,
      }),
    },
  };
});

function mountOccluders(): void {
  const toolbar = document.createElement('div');
  toolbar.className = 'unified-toolbar';
  toolbar.getBoundingClientRect = () => ({ right: TOOLBAR_RIGHT }) as DOMRect;
  document.body.appendChild(toolbar);

  const inputBar = document.createElement('div');
  inputBar.className = 'ai-input-bar';
  inputBar.getBoundingClientRect = () =>
    ({ height: INPUT_BAR_HEIGHT }) as DOMRect;
  document.body.appendChild(inputBar);
}

function makeCanvas(width: number, renderedWidth: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const height = (width / 3) * 2;
  Object.defineProperty(canvas, 'width', { value: width });
  Object.defineProperty(canvas, 'height', { value: height });
  canvas.getBoundingClientRect = () =>
    ({
      left: 10,
      top: 20,
      width: renderedWidth,
      height: renderedWidth ? (renderedWidth / 3) * 2 : 0,
    }) as DOMRect;
  return canvas;
}

function makeBoard(zoom = 1): PlaitBoard {
  return { viewport: { zoom } } as unknown as PlaitBoard;
}

describe('getCanvasPointerPoint', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('undoes the CSS scale so a tap maps to internal canvas coordinates', () => {
    // 手机上小地图被 scale(0.8) 缩过：canvas 内部 180 宽，rect 只有 144
    const canvas = makeCanvas(180, 144);

    expect(getCanvasPointerPoint(canvas, 10 + 72, 20)).toEqual([90, 0]);
    // 偏差用例：按未缩放的减法会得到 72（差 20%），点击就跳到错误的画布位置
    expect(getCanvasPointerPoint(canvas, 10 + 72, 20)[0]).not.toBe(72);
  });

  it('is a plain subtraction when nothing is scaled', () => {
    const canvas = makeCanvas(180, 180);
    expect(getCanvasPointerPoint(canvas, 10 + 90, 20 + 60)).toEqual([90, 60]);
  });

  it('falls back to 1:1 when the rect is not laid out', () => {
    const canvas = makeCanvas(180, 0);
    expect(getCanvasPointerPoint(canvas, 10 + 90, 20 + 20)).toEqual([90, 20]);
  });
});

describe('getVisibleViewportBox', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('excludes the toolbar and the input bar from the drawn viewport box', () => {
    mountOccluders();

    const box = getVisibleViewportBox(makeBoard(), [100, 200]);

    // 左让开工具栏 58，上让开顶部导航 50；宽高按可见区算
    expect(box).toEqual({
      x: 100 + TOOLBAR_RIGHT,
      y: 200 + 50,
      width: CONTAINER_WIDTH - TOOLBAR_RIGHT,
      height: CONTAINER_HEIGHT - 50 - INPUT_BAR_HEIGHT,
    });
  });

  it('divides the occlusion by zoom', () => {
    mountOccluders();

    const box = getVisibleViewportBox(makeBoard(2), [100, 200]);

    expect(box.x).toBe(100 + TOOLBAR_RIGHT / 2);
    expect(box.width).toBe((CONTAINER_WIDTH - TOOLBAR_RIGHT) / 2);
  });
});

describe('getOriginationForVisibleCenter', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('centers the target in the visible area, not the whole container', () => {
    mountOccluders();
    const board = makeBoard();

    const origination = getOriginationForVisibleCenter(board, 500, 600);

    // 可见区 x∈[58,390] 中心 224、y∈[50,684] 中心 367
    expect(origination).toEqual([500 - 224, 600 - 367]);
    // 按整块容器居中会得到 [500-195, 600-422]，落点在输入栏背后
    expect(origination[1]).not.toBe(600 - CONTAINER_HEIGHT / 2);
  });

  it('lands the target at the center of the box it reports', () => {
    mountOccluders();
    const board = makeBoard();

    const box = getVisibleViewportBox(
      board,
      getOriginationForVisibleCenter(board, 500, 600)
    );

    expect(box.x + box.width / 2).toBeCloseTo(500, 6);
    expect(box.y + box.height / 2).toBeCloseTo(600, 6);
  });
});
