/**
 * 小地图的几何换算。
 *
 * 单独成文件的原因：Minimap.tsx 已经 900+ 行，且这两块逻辑都是纯计算、可单测。
 */
import { PlaitBoard } from '@plait/core';
import type { RectangleClient } from '@plait/core';
import { getViewportOcclusion } from '../../utils/fit-frame';

/**
 * 把屏幕坐标换算成 canvas 的**内部**坐标（0..width / 0..height）。
 *
 * 手机上小地图被 CSS 缩放过（`transform: scale(0.8)` / collapsed 0.7），
 * `getBoundingClientRect()` 返回的是缩放后的尺寸，直接减 left/top 当内部坐标用
 * 会差 20%~25% —— 点/拖小地图就跳到错误的位置。canvas 没有做 DPR 放大，
 * 所以宽高比就是缩放系数的倒数。
 */
export function getCanvasPointerPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number
): [number, number] {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;

  return [(clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY];
}

/**
 * 「实际可见画布区域」在世界坐标里的矩形。
 *
 * origin 是容器左上角（0,0）处的世界坐标，而容器左上角被顶部导航/工具栏盖着，
 * 所以 x/y 也要按遮挡往里挪，否则框的位置和大小都不对。
 */
export function getVisibleViewportBox(
  board: PlaitBoard,
  origin: [number, number]
): RectangleClient {
  const container = PlaitBoard.getBoardContainer(board);
  const occlusion = getViewportOcclusion(container.clientWidth);
  const zoom = board.viewport.zoom;

  return {
    x: origin[0] + occlusion.left / zoom,
    y: origin[1] + occlusion.top / zoom,
    width: (container.clientWidth - occlusion.left - occlusion.right) / zoom,
    height: (container.clientHeight - occlusion.top - occlusion.bottom) / zoom,
  };
}

/**
 * 点击/拖拽小地图后，让目标世界坐标落在「实际可见区」的中心。
 *
 * 按整块容器居中会把目标放到输入栏背后（手机上底部被盖住 160px 左右）。
 */
export function getOriginationForVisibleCenter(
  board: PlaitBoard,
  targetX: number,
  targetY: number
): [number, number] {
  const container = PlaitBoard.getBoardContainer(board);
  const occlusion = getViewportOcclusion(container.clientWidth);
  const zoom = board.viewport.zoom;
  const availableWidth =
    container.clientWidth - occlusion.left - occlusion.right;
  const availableHeight =
    container.clientHeight - occlusion.top - occlusion.bottom;

  return [
    targetX - (occlusion.left + availableWidth / 2) / zoom,
    targetY - (occlusion.top + availableHeight / 2) / zoom,
  ];
}
