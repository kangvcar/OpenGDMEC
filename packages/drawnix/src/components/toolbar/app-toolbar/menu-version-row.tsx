import React, { useCallback, useRef } from 'react';
import './menu-version-row.scss';

/**
 * 菜单底部的只读版本行 —— 同时是管理员的隐藏入口。
 *
 * 教师发行版把设置面板对老师摘干净了（菜单/命令面板/模型下拉/报错跳转都不再开它），
 * 但排障时仍需要一个口子，于是约定：在版本号上连点 5 次打开。
 * 选版本号当宿主是因为它是纯静态文案，老师不会去点，而管理员口头指导
 * （「菜单最底下那行字，快点 5 下」）比键盘组合键更适合移动端。
 */

/** 连续点击的窗口：超过就重新计数，所以不需要 setTimeout 与清理 */
export const TAP_WINDOW_MS = 1500;
export const TAP_COUNT = 5;

export interface TapState {
  count: number;
  firstTapAt: number;
}

export const INITIAL_TAP_STATE: TapState = { count: 0, firstTapAt: 0 };

/**
 * 连点计数状态机（抽成纯函数便于单测）。
 * 返回命中时的 triggered=true 与归零后的状态 —— 命中后必须归零，
 * 否则下一次点击会立刻再次触发。
 */
export function advanceTap(
  state: TapState,
  now: number
): { state: TapState; triggered: boolean } {
  if (state.count === 0 || now - state.firstTapAt > TAP_WINDOW_MS) {
    return { state: { count: 1, firstTapAt: now }, triggered: false };
  }
  const count = state.count + 1;
  if (count >= TAP_COUNT) {
    return { state: INITIAL_TAP_STATE, triggered: true };
  }
  return { state: { count, firstTapAt: state.firstTapAt }, triggered: false };
}

// 由 vite define 注入；repo 内同款声明见 services/tracking/tracking-config.ts
declare const __APP_VERSION__: string;

const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

export interface MenuVersionRowProps {
  onTrigger: () => void;
}

export const MenuVersionRow: React.FC<MenuVersionRowProps> = ({ onTrigger }) => {
  const tapRef = useRef<TapState>(INITIAL_TAP_STATE);

  const handleClick = useCallback(() => {
    const result = advanceTap(tapRef.current, Date.now());
    tapRef.current = result.state;
    if (result.triggered) {
      onTrigger();
    }
  }, [onTrigger]);

  return (
    // 普通 div 而非 MenuItem：不会触发菜单的 onSelect，连点期间菜单不会自己关掉
    <div className="menu-version-row" onClick={handleClick}>
      v{APP_VERSION.split('+')[0]}
    </div>
  );
};

export default MenuVersionRow;
