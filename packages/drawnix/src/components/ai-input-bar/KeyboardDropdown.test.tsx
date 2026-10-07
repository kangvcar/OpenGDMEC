// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KeyboardDropdown, type DropdownPlacement } from './KeyboardDropdown';

function setViewportHeight(height: number) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

function mockRect(
  element: Element,
  rect: Pick<DOMRect, 'top' | 'left' | 'bottom' | 'width'>
) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: rect.left,
    y: rect.top,
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.left + rect.width,
    width: rect.width,
    height: rect.bottom - rect.top,
    toJSON: () => ({}),
  } as DOMRect);
}

async function renderDropdown(
  rect: Pick<DOMRect, 'top' | 'left' | 'bottom' | 'width'>,
  placement: DropdownPlacement = 'auto',
  islandTop?: number
) {
  const tree = (
    <KeyboardDropdown
      isOpen
      setIsOpen={vi.fn()}
      placement={placement}
      minMenuHeight={80}
      maxMenuHeight={240}
    >
      {({ containerRef, menuStyle, resolvedPlacement, availableHeight }) => (
        <div ref={containerRef} data-testid="container">
          <div
            data-testid="menu"
            data-placement={resolvedPlacement}
            data-available-height={availableHeight}
            style={menuStyle}
          />
        </div>
      )}
    </KeyboardDropdown>
  );
  const view = render(
    islandTop === undefined ? (
      tree
    ) : (
      <div className="ai-input-bar" data-testid="island">
        {tree}
      </div>
    )
  );
  mockRect(screen.getByTestId('container'), rect);
  if (islandTop !== undefined) {
    mockRect(screen.getByTestId('island'), {
      top: islandTop,
      left: 0,
      bottom: islandTop + 60,
      width: 720,
    });
  }
  await act(async () => {
    window.dispatchEvent(new Event('resize'));
  });
  return view;
}

describe('KeyboardDropdown', () => {
  beforeEach(() => {
    setViewportHeight(600);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it('trigger 靠近底部时自动向上展开', async () => {
    await renderDropdown({ top: 520, left: 24, bottom: 552, width: 160 });

    const menu = screen.getByTestId('menu');

    expect(menu.dataset.placement).toBe('up');
    expect(menu.style.bottom).toBe('88px');
    expect(menu.style.maxHeight).toBe('240px');
  });

  it('下方空间不足完整菜单时自动向上而不是缩高向下', async () => {
    await renderDropdown({ top: 340, left: 24, bottom: 372, width: 160 });

    const menu = screen.getByTestId('menu');

    expect(menu.dataset.placement).toBe('up');
    expect(menu.style.bottom).toBe('268px');
    expect(menu.style.maxHeight).toBe('240px');
  });

  it('trigger 靠近顶部时自动向下展开', async () => {
    await renderDropdown({ top: 24, left: 30, bottom: 56, width: 160 });

    const menu = screen.getByTestId('menu');

    expect(menu.dataset.placement).toBe('down');
    expect(menu.style.top).toBe('64px');
    expect(menu.style.maxHeight).toBe('240px');
  });

  it('上下都有足够空间时自动优先向下展开', async () => {
    await renderDropdown({ top: 220, left: 30, bottom: 252, width: 160 });

    expect(screen.getByTestId('menu').dataset.placement).toBe('down');
  });

  it('显式 placement 仍生效并限制最大高度', async () => {
    await renderDropdown({ top: 120, left: 30, bottom: 152, width: 160 }, 'up');

    const menu = screen.getByTestId('menu');

    expect(menu.dataset.placement).toBe('up');
    expect(menu.style.bottom).toBe('488px');
    expect(menu.style.maxHeight).toBe('100px');
  });

  it('触发器靠右且右侧空间不足时改为锚右缘向左展开', async () => {
    // 375 宽的屏上，右对齐的触发器左侧空间远多于右侧。
    setViewportWidth(375);
    await renderDropdown({ top: 300, left: 210, bottom: 332, width: 150 });

    const menu = screen.getByTestId('menu');

    expect(menu.dataset.placement).toBe('down');
    // left 必须显式写出来（auto）：只给 right 的话，调用方 CSS 里的 left: 0
    // 会胜出，菜单被钉在屏幕左缘。jsdom 把 auto 归一成 0px，所以这里断言
    // 「不是空串」—— 空串正好是让 CSS 生效的那种情况。
    expect(menu.style.getPropertyValue('left')).not.toBe('');
    expect(menu.style.right).toBe('15px'); // 375 - (210 + 150)
    expect(menu.style.maxWidth).toBe('348px'); // (210 + 150) - 12
  });

  it('触发器靠左时保持原来的左缘锚点', async () => {
    setViewportWidth(375);
    await renderDropdown({ top: 300, left: 16, bottom: 332, width: 120 });

    const menu = screen.getByTestId('menu');

    expect(menu.style.left).toBe('16px');
    expect(menu.style.right).toBe('');
    expect(menu.style.maxWidth).toBe('347px'); // 375 - 16 - 12
  });

  it('触发器在输入岛内时按岛的顶边向上展开，不压住输入框', async () => {
    await renderDropdown(
      { top: 500, left: 210, bottom: 532, width: 150 },
      'up',
      440
    );

    const menu = screen.getByTestId('menu');

    expect(menu.dataset.placement).toBe('up');
    // 600 - 440 + 8（岛顶再往上 8）；贴触发器算会是 600 - 500 + 8 = 108
    expect(menu.style.bottom).toBe('168px');
    expect(menu.style.maxHeight).toBe('240px'); // 岛顶之上空间充足，取上限
  });
});
