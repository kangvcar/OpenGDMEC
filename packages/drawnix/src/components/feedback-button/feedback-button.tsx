/**
 * FeedbackButton Component
 *
 * A circular feedback button positioned at the bottom-right of the canvas.
 * Shows a QR code image on click for user feedback.
 */

import React, { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';
import { useBoard } from '@plait-board/react-board';
import { PlaitBoard } from '@plait/core';
import { Z_INDEX } from '../../constants/z-index';
import {
  ADMIN_CONTACT_TEXT,
  ADMIN_QR_URL,
} from '../../constants/admin-contact';
import { INSTITUTION_CREDIT_TEXT } from '../../constants/institution-credit';
import { WeComIcon } from '../icons';
import { ToolButton } from '../tool-button';
import './feedback-button.scss';

export const FeedbackButton: React.FC = () => {
  const board = useBoard();
  const container = PlaitBoard.getBoardContainer(board);
  const [open, setOpen] = useState(false);

  // 预加载图片
  useEffect(() => {
    const img = new Image();
    img.src = ADMIN_QR_URL;
  }, []);

  return (
    <Popover placement="right-end" sideOffset={12} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolButton
          type="icon"
          icon={<WeComIcon />}
          aria-label={ADMIN_CONTACT_TEXT}
          // 浮层展开时关掉 tooltip：tooltip 落在浮层右下角，会整条盖住署名行，
          // 而且此刻浮层里本来就写着同样的文案，留着纯属重复。
          tooltip={open ? undefined : ADMIN_CONTACT_TEXT}
          tooltipPlacement="right"
          selected={open}
          visible={true}
          data-track="toolbar_click_feedback"
          onPointerDown={(e) => {
            e.event.stopPropagation();
          }}
          onClick={() => setOpen(!open)}
        />
      </PopoverTrigger>
      <PopoverContent container={container} style={{ zIndex: Z_INDEX.POPOVER_FEEDBACK }}>
        <div className="feedback-qrcode-content">
          <div className="feedback-qrcode-grid">
            <div className="feedback-qrcode-item">
              <img
                src={ADMIN_QR_URL}
                alt={`${ADMIN_CONTACT_TEXT}（管理员二维码）`}
                className="feedback-qrcode-image"
              />
              <div className="feedback-qrcode-text">{ADMIN_CONTACT_TEXT}</div>
              <div className="feedback-qrcode-credit">
                {INSTITUTION_CREDIT_TEXT}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
