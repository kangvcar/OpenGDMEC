/**
 * 新手导览的步骤定义
 *
 * 纯数据 + 纯函数，不碰 driver.js 实例，所以能脱离 DOM 单测（tour-steps.test.ts）。
 *
 * 锚点几乎全是既有 data-testid，只有企业微信那个是本次新加的：桌面/展开态走
 * FeedbackButton、手机收起态走 unified-toolbar 的快捷按钮，两条渲染路径，
 * 两处都打了 data-testid="toolbar-admin-key"，同时只有一处可见。
 *
 * 目标元素在手机上可能不存在（工具栏收起后整段 section 是 display:none），
 * 这种步骤由 driver.js 的 skipMissingElement 自动跳过，这里不用写分支。
 */

import type { DriveStep } from 'driver.js';

/** 导览依赖的锚点。集中放一处，选择器对不上时一眼能定位。 */
export const TOUR_TARGETS = {
  toolbar: '[data-testid="unified-toolbar"]',
  /** 整个输入栏而不是里面的 textarea：老师要认的是「这一条」是干什么的 */
  promptBar: '[data-testid="ai-input-bar"]',
  send: '[data-testid="ai-send-btn"]',
  taskQueue: '[data-testid="toolbar-tasks"]',
  adminKey: '[data-testid="toolbar-admin-key"]',
} as const;

export interface TourStepOptions {
  /** 现在有没有可用的图片生成凭据（hasInvocationRouteCredentials('image')） */
  hasCredentials: boolean;
}

/**
 * 6 步：开场 → 工具栏 → 输入栏 → 生成按钮 → 任务队列 → 填 Key。
 *
 * 顺序是照老师的心智走的：先知道「东西在哪」，再知道「怎么出图」，
 * 最后才是「还差一把钥匙」。最后一步的按钮文案随凭据状态变，
 * 因为没 Key 的老师需要的是一个动作入口，有 Key 的老师只需要知道位置。
 */
export function buildTourSteps({ hasCredentials }: TourStepOptions): DriveStep[] {
  return [
    {
      // 不带 element：driver.js 会把气泡居中，当开场白用
      popover: {
        title: '30 秒上手：怎么用一句话出图',
        description: '跟着走一遍，你就知道 Key 在哪填、图在哪生、结果在哪看。',
        showButtons: ['next', 'close'],
        nextBtnText: '开始',
        showProgress: false,
      },
    },
    {
      element: TOUR_TARGETS.toolbar,
      popover: {
        title: '左边这一列是工具栏',
        description:
          '思维导图、形状、文本、画笔都在这里。想往画布上加东西，都从这一列拿。',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: TOUR_TARGETS.promptBar,
      popover: {
        title: '在这里描述你要的画面',
        description:
          '一句话就够，比如「一只戴黄帽子的猫，水彩风格」。写得越具体，出图越接近你想要的。',
        side: 'top',
      },
    },
    {
      element: TOUR_TARGETS.send,
      popover: {
        title: '点这里开始生成',
        description: '也可以直接按回车。通常十几秒出图，一次可以生成 1 到 4 张。',
        side: 'top',
      },
    },
    {
      element: TOUR_TARGETS.taskQueue,
      popover: {
        title: '进度和结果都在这里',
        description:
          '出好的图会自动放到画布上；生成记录也留在这里，随时能翻回来重新用。',
        side: 'right',
      },
    },
    {
      element: TOUR_TARGETS.adminKey,
      popover: hasCredentials
        ? {
            title: '这里管你的 Key',
            description:
              '以后想换 Key，或者额度用完了要找管理员，都点这个企业微信图标。',
            side: 'right',
            doneBtnText: '完成',
          }
        : {
            title: '还差一步：填 Key',
            description:
              '没有 Key 生不了图。点这个企业微信图标，扫码找管理员领取，把收到的 Key 粘贴进去就能用了。',
            side: 'right',
            doneBtnText: '去填 Key',
          },
    },
  ];
}
