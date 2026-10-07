/**
 * 空画布上的「还没配 API Key」引导卡片
 *
 * 只在「完全没配凭据 + 画布为空」时出现在画布正中：一句说明 + 一个按钮，
 * 点了打开 admin-key-guidance 的弹窗（二维码 + 粘贴框）。配好即消失。
 *
 * 为什么是屏幕固定浮层而不是 Plait 插件：与 CanvasWatermark 同样的理由 ——
 * 不参与 board 坐标系（不随缩放平移），因此不存在坐标系不一致的问题。
 * 区别是这里有一个可点的按钮，所以卡片自身要 pointer-events: auto（水印是 none），
 * 且不能 aria-hidden。
 *
 * 为什么只给卡片开 pointer-events：只有卡片那一小块矩形挡住画布，
 * 矩形之外照常拖拽/框选；画布一有内容（isCanvasEmpty 变 false）卡片就没了。
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'tdesign-react';
import { ADMIN_CONTACT_TEXT } from '../../constants/admin-contact';
import { requestAdminApiKey } from '../../utils/admin-key-guidance-event';
import './admin-key-canvas-card.scss';

interface AdminKeyCanvasCardProps {
  /**
   * 未配置任何凭据且画布为空时传 true。
   * 加载中（判空结果未知）要传 false，否则启动瞬间会闪一下。
   */
  visible: boolean;
}

export const AdminKeyCanvasCard: React.FC<AdminKeyCanvasCardProps> = ({
  visible,
}) => {
  if (!visible || typeof document === 'undefined') {
    return null;
  }

  // 必须 portal 到 body：本组件渲染在 .ai-input-bar 的子树里，而那个容器是
  // position: fixed 且带 transform —— transform 会让它同时成为 absolute 与
  // fixed 后代的包含块，居中会偏到输入栏上方。portal 出去才拿得回视口坐标。
  return createPortal(
    <div className="admin-key-canvas-card">
      <p className="admin-key-canvas-card__title">尚未配置 API Key</p>
      <p className="admin-key-canvas-card__desc">{ADMIN_CONTACT_TEXT}</p>
      <Button
        theme="primary"
        size="medium"
        // 不关心回执：这里只是打开弹窗。没有监听者时 Promise resolve null，不会 reject。
        onClick={() => void requestAdminApiKey()}
      >
        获取 API Key
      </Button>
    </div>,
    document.body
  );
};
