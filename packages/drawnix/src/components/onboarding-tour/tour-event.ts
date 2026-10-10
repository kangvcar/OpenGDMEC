/**
 * 「重看新手引导」的事件通道
 *
 * 导览组件是懒加载的（driver.js 与它的 CSS 不进主包），工具栏那个按钮拿不到
 * 组件引用，所以和 admin-key-guidance-event.ts 用同一套做法：派发自定义事件，
 * 目标组件自己监听。单向触发、不需要回执，所以不带 detail。
 */
export const ONBOARDING_TOUR_EVENT = 'onboarding-tour-request';

export function requestOnboardingTour(): void {
  window.dispatchEvent(new Event(ONBOARDING_TOUR_EVENT));
}
