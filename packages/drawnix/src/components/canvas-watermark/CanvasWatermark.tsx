/**
 * 画布空状态水印
 *
 * 只在画布为空时显示两块东西，共用一个开关：画布中心的平台名（「这是什么平台」），
 * 顶部的小字机构署名（「谁在支持」，让老师在没有作品时也能看到是谁在支持这个工具）。
 *
 * 为什么是屏幕固定浮层而不是 Plait 插件：CLAUDE.md 那条「新画布功能必须做成插件」
 * 的理由是坐标系不一致与事件冲突，而这个水印不参与 board 坐标系（不随缩放平移），
 * 且 pointer-events: none 后不产生任何事件，两个前提都不成立。仓库里的同类浮层
 * （缩放控件/minimap/输入栏/工具栏）也全是固定定位，没有一个是插件。
 *
 * 附带的好处：导出走 Plait 的 toImage，只渲染 board-host-svg，所以水印天然不进
 * 导出图 —— 这与「背景水印」的定位一致。
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { INSTITUTION_CREDIT_TEXT } from '../../constants/institution-credit';
import './canvas-watermark.scss';

interface CanvasWatermarkProps {
  /**
   * 画布为空时传 true。
   * 加载中（判空结果未知）要传 false，否则启动瞬间会闪一下。
   */
  visible: boolean;
}

export const CanvasWatermark: React.FC<CanvasWatermarkProps> = ({ visible }) => {
  if (!visible || typeof document === 'undefined') {
    return null;
  }

  // 必须 portal 到 body：本组件渲染在 .ai-input-bar 的子树里，而那个容器是
  // position: fixed 且带 transform —— transform 会让它同时成为 absolute 与 fixed
  // 后代的包含块，水印会跑到输入栏上方而不是画布顶部。portal 出去才拿得回视口坐标。
  //
  // 纯视觉水印：同样的信息在启动屏与引导弹窗里都已经无障碍可达，
  // 这里再让读屏软件念一遍只会给画布区域添噪。
  return createPortal(
    <>
      {/* 平台名用字面量：全仓 40+ 处都这么写，没有共享常量，这里也不新造一个 */}
      <div className="canvas-watermark canvas-watermark--wordmark" aria-hidden="true">
        OpenGDMEC
      </div>
      <div className="canvas-watermark canvas-watermark--credit" aria-hidden="true">
        {INSTITUTION_CREDIT_TEXT}
      </div>
    </>,
    document.body
  );
};
