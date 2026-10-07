/**
 * FeedbackButton Component
 *
 * 工具栏上的企业微信图标：点开就是「配置 API Key」引导弹窗。
 *
 * 这里刻意只是打开 admin-key-guidance 的弹窗，不再自己画一份二维码浮层 ——
 * 弹窗里二维码、联系人说明、机构署名、Key 输入框都有，是原浮层的严格超集。
 * 两份 UI 并存只会让同一句文案、同一张图各写一遍。
 */

import React from 'react';
import { LogoWecomIcon } from 'tdesign-icons-react';
import { ADMIN_CONTACT_TEXT } from '../../constants/admin-contact';
import { requestAdminApiKey } from '../../utils/admin-key-guidance-event';
import { ToolButton } from '../tool-button';

export const FeedbackButton: React.FC = () => (
  <ToolButton
    type="icon"
    // 用图标库自带的企业微信标识，而不是自绘的通用对话气泡：
    // 老师要认的是品牌图形，气泡换个场景就指代不明了。
    icon={<LogoWecomIcon />}
    aria-label={ADMIN_CONTACT_TEXT}
    tooltip={ADMIN_CONTACT_TEXT}
    tooltipPlacement="right"
    visible={true}
    data-track="toolbar_click_feedback"
    onPointerDown={(e) => {
      e.event.stopPropagation();
    }}
    // 返回值是「老师填了什么 Key」，只有提交被拦下那条路径需要；
    // 这里只是打开弹窗，不关心回执。没有监听者时它 resolve null，不会 reject。
    onClick={() => void requestAdminApiKey()}
  />
);
