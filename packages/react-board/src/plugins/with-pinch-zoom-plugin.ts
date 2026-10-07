import {
  BoardTransforms,
  distanceBetweenPointAndPoint,
  getPointBetween,
  MAX_ZOOM,
  MIN_ZOOM,
  PlaitBoard,
  Point,
} from '@plait/core';
import { getCurrentViewportOrigination } from '../utils/viewport';

interface PointerRecord {
  pointerId: number;
  lastPoint: Point;
  currentPoint: Point;
  hasMoved: boolean;
}

export const withPinchZoom = (board: PlaitBoard) => {
  const { pointerDown, pointerMove, pointerUp, globalPointerUp, pointerCancel } =
    board;

  const pointerRecords: PointerRecord[] = [];
  let isPinching = false;

  board.pointerDown = (event: PointerEvent) => {
    const point: Point = [event.clientX, event.clientY];

    if (pointerRecords.length < 2) {
      pointerRecords.push({
        pointerId: event.pointerId,
        lastPoint: point,
        currentPoint: point,
        hasMoved: false,
      });
    }

    pointerDown(event);
  };

  board.pointerMove = (event: PointerEvent) => {
    const point: Point = [event.clientX, event.clientY];

    if (pointerRecords.length >= 2) {
      const record = pointerRecords.find(
        (r) => r.pointerId === event.pointerId
      );
      if (record) {
        record.currentPoint = point;
        record.hasMoved = true;

        // 检查是否两个触控点都移动过
        if (
          pointerRecords.length === 2 &&
          pointerRecords.every((r) => r.hasMoved)
        ) {
          const p1 = pointerRecords[0]!;
          const p2 = pointerRecords[1]!;
          const pinchCenter = getPointBetween(
            ...p1.lastPoint,
            ...p2.lastPoint
          ) as Point;
          const newPinchCenter = getPointBetween(
            ...p1.currentPoint,
            ...p2.currentPoint
          ) as Point;
          const dx = newPinchCenter[0] - pinchCenter[0];
          const dy = newPinchCenter[1] - pinchCenter[1];

          // hand moving
          const boardContainerRect =
            PlaitBoard.getBoardContainer(board).getBoundingClientRect();
          const halfOfWidth = boardContainerRect.width / 2;
          const halfOfHeight = boardContainerRect.height / 2;
          const zoom = board.viewport.zoom;
          const origination = getCurrentViewportOrigination(board);
          let centerX = origination[0] + halfOfWidth / zoom - dx / zoom;
          let centerY = origination[1] + halfOfHeight / zoom - dy / zoom;
          let newOrigination = [
            centerX - boardContainerRect.width / 2 / zoom,
            centerY - boardContainerRect.height / 2 / zoom,
          ] as Point;

          let newZoom = zoom;
          const lastDistance = distanceBetweenPointAndPoint(
            ...p1.lastPoint,
            ...p2.lastPoint
          );
          const currentDistance = distanceBetweenPointAndPoint(
            ...p1.currentPoint,
            ...p2.currentPoint
          );
          // zoom 处理
          const scale = currentDistance / lastDistance;

          const v1 = [
            p1.currentPoint[0] - p1.lastPoint[0],
            p1.currentPoint[1] - p1.lastPoint[1],
          ] as Point;
          const v2 = [
            p2.currentPoint[0] - p2.lastPoint[0],
            p2.currentPoint[1] - p2.lastPoint[1],
          ] as Point;

          const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
          const v1Magnitude = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
          const v2Magnitude = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);

          const cosTheta = dotProduct / (v1Magnitude * v2Magnitude || 1);

          // 控制缩放
          // 基于余弦相似度（Cosine Similarity）
          // 余弦值 > 0.8：判定为平移手势（向量基本同向）
          // 余弦值 < -0.7：判定为缩放手势（向量基本反向）
          // 其他情况：未知手势
          if (
            cosTheta < -0.7 ||
            (cosTheta <= 0.8 && isPinching && scale >= 0.01)
          ) {
            isPinching = true;
          } else {
            isPinching = false;
          }
          if (isPinching) {
            newZoom = Math.min(
              Math.max(board.viewport.zoom * scale, MIN_ZOOM),
              MAX_ZOOM
            );
            const nativeElement = PlaitBoard.getBoardContainer(board);
            const nativeElementRect = nativeElement.getBoundingClientRect();
            const zoomCenterWidth = newPinchCenter[0] - nativeElementRect.x;
            const zoomCenterHeight = newPinchCenter[1] - nativeElementRect.y;
            centerX = newOrigination[0] + zoomCenterWidth / zoom;
            centerY = newOrigination[1] + zoomCenterHeight / zoom;
            newOrigination = [
              centerX - zoomCenterWidth / newZoom,
              centerY - zoomCenterHeight / newZoom,
            ] as Point;
          }
          BoardTransforms.updateViewport(board, newOrigination, newZoom);
          pointerRecords.forEach((r) => {
            r.lastPoint = r.currentPoint;
            r.hasMoved = false;
          });
        }
      }
      return;
    }

    pointerMove(event);
  };

  // 指针离开后不再构成双指手势，捏合状态必须一并复位，
  // 否则残留的 isPinching 会把下一次手势也判定为缩放。
  const releasePointer = (pointerId: number) => {
    const index = pointerRecords.findIndex((r) => r.pointerId === pointerId);
    if (index !== -1) {
      pointerRecords.splice(index, 1);
    }
    if (pointerRecords.length < 2) {
      isPinching = false;
    }
  };

  board.pointerUp = (event: PointerEvent) => {
    releasePointer(event.pointerId);
    pointerUp(event);
  };

  board.globalPointerUp = (event: PointerEvent) => {
    releasePointer(event.pointerId);
    globalPointerUp(event);
  };

  // 浏览器接管手势（捏合缩放、长按菜单等）时只会派发 pointercancel，
  // 没有 pointerup。不清理记录就会让 length >= 2 永久成立，
  // 上面 pointerMove 的提前 return 会吞掉此后所有移动 —— 画布仿佛卡死。
  board.pointerCancel = (event: PointerEvent) => {
    releasePointer(event.pointerId);
    pointerCancel(event);
  };

  return board;
};
