/**
 * 新手引导（首次使用导览）
 *
 * 用途：老师第一次打开平台时，「Key 在哪填、图在哪生」两个卡点无从下手。
 * 内测反馈确认了这一点，所以这里补一次可跳过、可重看的导览。
 *
 * 为什么用 driver.js 而不是自己画：挖空遮罩、步骤引擎、滚动/resize 重定位、
 * 键盘与焦点管理是它的核心；项目已装的 @floating-ui/react 只能定位气泡，
 * 自研等于把这些边界情况重写一遍。driver.js 是 MIT、零子依赖、gzip 约 6KB。
 *
 * 两条必须知道的约束：
 *
 * 1. driver.js 自己管层级 —— 遮罩的 z-index 是它内联写死的 10000，气泡是它 CSS 里的
 *    1e9。这两个值走不了项目的 Z_INDEX / $z-* 令牌，属于第三方内部实现，不是我们
 *    硬编码。代价是：导览存活期间不能叠任何弹窗（遮罩会压住 WinBox 设置窗和
 *    TDesign Dialog），所以「去填 Key」必须先 destroy() 再开弹窗，见 onDoneClick。
 *
 * 2. 首播判定里读凭据必须等 settingsManager.waitForInitialization() —— 凭据是加密
 *    存的，初始化完成前 hasInvocationRouteCredentials 会把「已配」误判成「没配」，
 *    直接同步读会把已经配好 Key 的老师也拉进导览。
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { driver, type DriveStep, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  hasInvocationRouteCredentials,
  settingsManager,
} from '../../utils/settings-manager';
import { requestAdminApiKey } from '../../utils/admin-key-guidance-event';
import { LS_KEYS } from '../../constants/storage-keys';
import { buildTourSteps } from './tour-steps';
import { ONBOARDING_TOUR_EVENT } from './tour-event';
import './onboarding-tour.scss';

/**
 * 读不到就当作「看过」：隐私模式下 localStorage 可能直接抛，这种情况下宁可不播，
 * 也不要每次刷新都糊一层遮罩上去 —— 那正是 admin-key-guidance 里被否掉的观感。
 */
function hasSeenTour(): boolean {
  try {
    return window.localStorage.getItem(LS_KEYS.ONBOARDING_TOUR_DONE) !== null;
  } catch (err) {
    console.debug('[OnboardingTour] 读取引导标记失败，按已看过处理', err);
    return true;
  }
}

function markTourSeen(): void {
  try {
    window.localStorage.setItem(LS_KEYS.ONBOARDING_TOUR_DONE, '1');
  } catch (err) {
    console.debug('[OnboardingTour] 写入引导标记失败', err);
  }
}

interface OnboardingTourProps {
  /** 画板数据就绪前不播：启动屏还挂着的时候弹导览很突兀 */
  ready: boolean;
}

/**
 * 目标元素在 DOM 里、但没真正渲染出来时，driver.js 认不出来：它的
 * skipMissingElement 只查存在性（源码里就是 querySelector），于是会去高亮一个
 * 0×0 的角，屏幕上就是整块变暗 + 气泡指向左上角空白（实测复现）。
 * 手机收起态的工具栏正是这种情况 —— 底部那段 section 是 display:none，按钮还在
 * DOM 里，所以「任务队列」这一步在手机上本来就没有可见的落点，只能整步去掉。
 *
 * 真正不存在的元素不在这里处理：那是懒挂载（AI 输入栏），交给 driver.js 的
 * waitForElement 去等、等不到再用 skipMissingElement 跳过。
 */
function isInvisibleInDom(step: DriveStep): boolean {
  const element =
    typeof step.element === 'string'
      ? document.querySelector(step.element)
      : null;
  return !!element && element.getClientRects().length === 0;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ ready }) => {
  const driverRef = useRef<Driver | null>(null);
  // 「去填 Key」的意图。只有最后一步点那个按钮才置位；Esc、关闭按钮、
  // 点遮罩退出都不置位，所以不会误弹二维码。
  const pendingKeyCtaRef = useRef(false);
  // 步骤数组建好就固定了，onDoneClick 里读它判断按钮该不该弹窗
  const hasCredentialsRef = useRef(false);

  const start = useCallback(() => {
    if (driverRef.current?.isActive()) {
      return;
    }

    const hasCredentials = hasInvocationRouteCredentials('image');
    hasCredentialsRef.current = hasCredentials;

    const driverObj = driver({
      // 先滤掉「在 DOM 里但没渲染出来」的目标（见 isInvisibleInDom）
      steps: buildTourSteps({ hasCredentials }).filter(
        (step) => !isInvisibleInDom(step)
      ),
      // 输入栏是懒挂载的（DeferredAIInputBar 在 Suspense 里），首屏不在 DOM 里：
      // 等它上来，等不到跳过这一步。真正不存在的元素由这两项原生能力兜住。
      waitForElement: 3000,
      skipMissingElement: true,
      // 比默认的 0.7 轻：配色规范禁止重黑遮罩压暗内容
      overlayOpacity: 0.55,
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: 'opentu-tour',
      progressText: '{{current}}/{{total}}',
      // driver.js 的默认按钮文案是英文（Next / Previous / Done），
      // 只有开场和末步的文案在步骤里单独覆盖，中间几步走这里的默认值
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      overlayClickBehavior: 'close',
      allowClose: true,
      // 前庭功能敏感的老师不该被这段动画折腾
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      onDoneClick: () => {
        // 提供了 onDoneClick 就得自己收尾：driver.js 的默认行为（末步销毁）会被它顶掉
        pendingKeyCtaRef.current = !hasCredentialsRef.current;
        driverObj.destroy();
      },
      onDestroyed: () => {
        driverRef.current = null;
        if (!pendingKeyCtaRef.current) {
          return;
        }
        pendingKeyCtaRef.current = false;
        // 此时遮罩已卸载，弹窗不会再被它压住。填完后走的是 geminiSettings，
        // 和输入栏那行「尚未配置 API Key」提示读的是同一份配置。
        void requestAdminApiKey();
      },
    });

    driverRef.current = driverObj;
    driverObj.drive();
  }, []);

  // 首次自动播放：没看过 && 还没配 Key。第二个条件是关键 ——
  // 已经在用的老师（含管理员自己的测试账号）一次都不会被打扰。
  useEffect(() => {
    if (!ready || hasSeenTour()) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        await settingsManager.waitForInitialization();
      } catch (err) {
        // 读不到凭据就不知道老师配没配，宁可不播
        console.debug('[OnboardingTour] 设置初始化失败，放弃自动播放', err);
        return;
      }
      if (cancelled || hasSeenTour()) {
        return;
      }
      if (hasInvocationRouteCredentials('image')) {
        return;
      }
      // 标记写在 drive() 之前：老师中途刷新不该再从头播一遍
      markTourSeen();
      start();
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [ready, start]);

  // 工具栏那个「使用引导」按钮
  useEffect(() => {
    const handleRequest = () => start();
    window.addEventListener(ONBOARDING_TOUR_EVENT, handleRequest);
    return () => {
      window.removeEventListener(ONBOARDING_TOUR_EVENT, handleRequest);
    };
  }, [start]);

  useEffect(
    () => () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    },
    []
  );

  // 导览完全由 driver.js 操作 DOM，这里没有可渲染的东西
  return null;
};
