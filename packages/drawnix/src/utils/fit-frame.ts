/**
 * 自适应 Frame 工具函数
 *
 * 将视口缩放到选中的 Frame（或第一个 Frame），
 * 并考虑左侧工具栏/抽屉、右侧 ChatDrawer、底部输入栏等遮挡区域。
 */
import {
  PlaitBoard,
  BoardTransforms,
  RectangleClient,
  MIN_ZOOM,
  getRectangleByElements,
  getSelectedElements,
} from '@plait/core';
import { isFrameElement, type PlaitFrame } from '../types/frame.types';

/** 工具栏右边界兜底值：默认贴边 + 58px 工具栏 */
const DEFAULT_TOOLBAR_RIGHT_EDGE = 58;
/** 底部 AI 输入栏高度兜底值（量不到真实高度时用） */
const BOTTOM_BAR_HEIGHT_FALLBACK = 80;
/** 顶部导航控件高度 */
const TOP_BAR_HEIGHT = 50;
/** 四周留白 */
const FIT_PADDING = 40;

/**
 * 底部 AI 输入栏的实际占高。
 *
 * 这里原来是写死的 80px：手机上输入栏带提示行时实测 130-210px，只留 80px 会让
 * 「适应」之后的内容仍有下半截压在输入栏下面 —— 也就是老师反馈的「图片看不全」。
 * 高度优先读 AIInputBar 发布的 CSS 变量（见 AIInputBar 里的 ResizeObserver），
 * 拿不到再量 DOM，最后回退到兜底值。
 */
function getBottomOcclusion(): number {
  if (typeof document === 'undefined') return BOTTOM_BAR_HEIGHT_FALLBACK;

  const published = getComputedStyle(document.documentElement).getPropertyValue(
    '--aitu-ai-input-bar-height'
  );
  const parsed = parseFloat(published);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  const barEl = document.querySelector('.ai-input-bar') as HTMLElement | null;
  const measured = barEl?.getBoundingClientRect().height ?? 0;
  return measured > 0 ? measured : BOTTOM_BAR_HEIGHT_FALLBACK;
}

function getToolbarOcclusion(totalWidth: number): {
  left: number;
  right: number;
} {
  const toolbarEl = document.querySelector(
    '.unified-toolbar'
  ) as HTMLElement | null;
  const leftDrawerEl = document.querySelector(
    '.side-drawer--open.side-drawer--toolbar-right'
  ) as HTMLElement | null;
  const isDockRight = document.documentElement.classList.contains(
    'aitu-toolbar-dock-right'
  );
  let left = toolbarEl ? 0 : DEFAULT_TOOLBAR_RIGHT_EDGE;
  let right = 0;

  if (toolbarEl) {
    const rect = toolbarEl.getBoundingClientRect();
    if (isDockRight) {
      right = Math.max(right, totalWidth - rect.left);
    } else {
      left = Math.max(left, rect.right);
    }
  }

  if (leftDrawerEl) {
    const rect = leftDrawerEl.getBoundingClientRect();
    if (isDockRight) {
      right = Math.max(right, totalWidth - rect.left);
    } else {
      left = Math.max(left, rect.right);
    }
  }

  return {
    left: Math.max(0, Math.round(left)),
    right: Math.max(0, Math.round(right)),
  };
}

/** 视口四周被浮层挡住的像素（CSS px，相对画布容器左上角） */
export interface ViewportOcclusion {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * 「实际可见区」相对画布容器被吃掉多少。
 *
 * 画布容器是整屏（手机 390×844），但老师真正看得见的只有浮层没盖住的那块：
 * 左侧工具栏、右侧聊天抽屉、顶部导航、底部 AI 输入栏。自适应、小地图视口框、
 * 「某点是否可见」的判断都得以这块区域为准，否则内容会被停在浮层后面。
 */
export function getViewportOcclusion(totalWidth: number): ViewportOcclusion {
  const toolbarOcclusion = getToolbarOcclusion(totalWidth);
  const chatDrawerEl = document.querySelector(
    '.chat-drawer--open'
  ) as HTMLElement | null;

  return {
    left: toolbarOcclusion.left,
    right: Math.max(
      toolbarOcclusion.right,
      chatDrawerEl ? chatDrawerEl.offsetWidth : 0
    ),
    // ponytail: 顶部导航高 50 是估值，手机上主因是底部输入栏；出现新的顶部浮层再实测
    top: TOP_BAR_HEIGHT,
    bottom: getBottomOcclusion(),
  };
}

/**
 * 把视口对准一个世界坐标矩形：缩放到它刚好完整可见，并居中到「实际可见区域」
 * （已扣除工具栏/抽屉/输入栏遮挡）。
 *
 * 走的是 BoardTransforms.updateViewport（不夹取），所以能缩到比 updateZoom 更小 ——
 * 但这里仍然按 MIN_ZOOM 兜底一次，避免内容特别大时算出毫无意义的极小缩放。
 *
 * @param options.maxZoom 允许的最大缩放，默认 3。生成结果落图后的自适应传 1：
 *                        只负责「看得全」，不把一张小图放大到糊。
 * @returns 是否成功应用
 */
export function fitRectInViewport(
  board: PlaitBoard,
  targetRect: RectangleClient,
  options: { maxZoom?: number } = {}
): boolean {
  if (targetRect.width <= 0 || targetRect.height <= 0) return false;

  const container = PlaitBoard.getBoardContainer(board);
  const totalWidth = container.clientWidth;
  const totalHeight = container.clientHeight;

  const occlusion = getViewportOcclusion(totalWidth);

  const availableWidth =
    totalWidth - occlusion.left - occlusion.right - FIT_PADDING * 2;
  const availableHeight =
    totalHeight - occlusion.top - occlusion.bottom - FIT_PADDING * 2;

  if (availableWidth <= 0 || availableHeight <= 0) return false;

  const zoom = Math.max(
    Math.min(
      availableWidth / targetRect.width,
      availableHeight / targetRect.height,
      options.maxZoom ?? 3
    ),
    MIN_ZOOM
  );

  const visibleCenterX = occlusion.left + FIT_PADDING + availableWidth / 2;
  const visibleCenterY = occlusion.top + FIT_PADDING + availableHeight / 2;
  const targetCenterX = targetRect.x + targetRect.width / 2;
  const targetCenterY = targetRect.y + targetRect.height / 2;
  const origination: [number, number] = [
    targetCenterX - visibleCenterX / zoom,
    targetCenterY - visibleCenterY / zoom,
  ];

  BoardTransforms.updateViewport(board, origination, zoom);
  return true;
}

/**
 * 「适应屏幕」：把画布上所有内容缩到实际可见区里。
 *
 * 只有内容比可见区大时才缩小（maxZoom 传当前 zoom），不会把一张小图放大到糊 ——
 * 和 Plait 自带 fitViewport 的手感一致，但会扣掉浮层遮挡。
 *
 * @returns 是否成功应用（画布为空时返回 false）
 */
export function fitAllElementsInVisibleArea(
  board: PlaitBoard,
  options: { maxZoom?: number } = {}
): boolean {
  const bounds = getRectangleByElements(board, board.children, true);
  if (!bounds) return false;

  return fitRectInViewport(board, bounds, options);
}

function getAllFrameBounds(board: PlaitBoard): RectangleClient | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of board.children) {
    if (!isFrameElement(el)) continue;

    const rect = RectangleClient.getRectangleByPoints(el.points);
    if (rect.width <= 0 || rect.height <= 0) continue;

    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 将视口自适应到指定 Frame 或自动选择一个 Frame
 * @returns 是否成功定位到 Frame
 */
export function fitFrame(board: PlaitBoard): boolean {
  // 1. 找到目标 Frame：优先选中的 Frame，否则用第一个 Frame
  const selectedElements = getSelectedElements(board);
  let targetFrame: PlaitFrame | null = null;

  for (const el of selectedElements) {
    if (isFrameElement(el)) {
      targetFrame = el;
      break;
    }
  }

  if (!targetFrame) {
    for (const el of board.children) {
      if (isFrameElement(el)) {
        targetFrame = el;
        break;
      }
    }
  }

  if (!targetFrame) return false;

  // 2. 计算 Frame 的世界坐标矩形
  const frameRect = RectangleClient.getRectangleByPoints(targetFrame.points);

  return fitRectInViewport(board, frameRect);
}

/**
 * 将视口自适应到所有 PPT 页面（Frame）的联合边界
 * @returns 是否成功定位到页面全局范围
 */
export function fitAllPPTFrames(board: PlaitBoard): boolean {
  const frameBounds = getAllFrameBounds(board);
  if (!frameBounds) return false;

  return fitRectInViewport(board, frameBounds);
}
