import {
  PlaitBoard,
  ZOOM_STEP,
  initializeViewBox,
  initializeViewportContainer,
  isFromViewportChange,
  setIsFromViewportChange,
  updateViewportByScrolling,
  updateViewportOffset,
} from '@plait/core';
import { useEffect, useRef } from 'react';
import {
  consumeIgnoredViewportScroll,
  refreshSelectedElementActiveSectionsForViewportChange,
  updateZoomFromCurrentViewport,
} from '../utils/viewport';
import { useEventListener } from './use-event-listener';

const useBoardEvent = (
  board: PlaitBoard,
  viewportContainerRef: React.RefObject<HTMLDivElement>
) => {
  useEventListener(
    'scroll',
    (event) => {
      if (consumeIgnoredViewportScroll(board) || isFromViewportChange(board)) {
        setIsFromViewportChange(board, false);
      } else {
        const target = event.target as HTMLElement;
        if (!target) return;
        const { scrollLeft, scrollTop } = target;
        updateViewportByScrolling(board, scrollLeft, scrollTop);
      }
    },
    { target: viewportContainerRef }
  );

  useEventListener(
    'touchstart',
    (event) => {
      // 只拦多指手势（双指缩放/平移）。单指也拦会连同兼容鼠标事件一起被抑制，
      // 其中包含 click —— 而画布上的浮动文本输入框与抽屉收起都挂在 click 上，
      // 无差别 preventDefault 会让它们在触屏上彻底失效。
      // 缩放与滚动的其余防线（viewport meta 的 user-scalable=no、
      // html/body/#root 的 touch-action: none）不受影响。
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { target: viewportContainerRef, passive: false }
  );

  useEventListener(
    'wheel',
    (event) => {
      // Credits to excalidraw
      // https://github.com/excalidraw/excalidraw/blob/b7d7ccc929696cc17b4cc34452e4afd846d59f4f/src/components/App.tsx#L9060
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        const { deltaX, deltaY } = event;
        const zoom = board.viewport.zoom;
        const sign = Math.sign(deltaY);
        const MAX_STEP = ZOOM_STEP * 100;
        const absDelta = Math.abs(deltaY);
        let delta = deltaY;
        if (absDelta > MAX_STEP) {
          delta = MAX_STEP * sign;
        }
        let newZoom = zoom - delta / 100;
        // increase zoom steps the more zoomed-in we are (applies to >100% only)
        newZoom +=
          Math.log10(Math.max(1, zoom)) *
          -sign *
          // reduced amplification for small deltas (small movements on a trackpad)
          Math.min(1, absDelta / 20);
        updateZoomFromCurrentViewport(
          board,
          newZoom,
          PlaitBoard.getMovingPointInBoard(board)
        );
      }
    },
    { target: viewportContainerRef, passive: false }
  );

  const isInitialized = useRef(false);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (!isInitialized.current) {
        isInitialized.current = true;
        return;
      }
      initializeViewportContainer(board);
      initializeViewBox(board);
      updateViewportOffset(board);
      refreshSelectedElementActiveSectionsForViewportChange(board);
    });
    resizeObserver.observe(PlaitBoard.getBoardContainer(board));
    return () => {
      resizeObserver && (resizeObserver as ResizeObserver).disconnect();
    };
  }, []);
};

export default useBoardEvent;
