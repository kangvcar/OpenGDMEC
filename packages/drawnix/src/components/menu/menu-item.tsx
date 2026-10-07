import React, { useState, useRef } from 'react';
import {
  getMenuItemClassName,
  useHandleMenuItemClick,
} from './common';
import MenuItemContent from './menu-item-content';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';
import { useIsTouchDevice } from '../../hooks/useDeviceType';

const MenuItem = ({
  icon,
  onSelect,
  children,
  shortcut,
  className,
  selected,
  submenu,
  ...rest
}: {
  icon?: React.ReactNode;
  onSelect: (event: Event) => void;
  children: React.ReactNode;
  shortcut?: string;
  selected?: boolean;
  className?: string;
  submenu?: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'>) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<number>();
  const { title, ...buttonProps } = rest;
  const ariaLabel = buttonProps['aria-label'] ?? title;
  const isTouchDevice = useIsTouchDevice();
  const handleClick = useHandleMenuItemClick(buttonProps.onClick, (event) => {
    if (submenu && isTouchDevice) {
      // 触屏没有 hover，click 是打开子菜单的唯一入口。但这一下点击若照常冒泡
      // 「选中」事件，父菜单会立刻把整棵子树关掉 —— 子菜单一闪即散，
      // 表现为「点了没反应」（桌面靠 hover 先一步打开，所以看不出来）。
      event.preventDefault();
      setIsOpen(true);
      return;
    }
    onSelect(event);
  });
  
  const menuItemContent = (
    <MenuItemContent icon={icon} shortcut={shortcut}>
      {children}
    </MenuItemContent>
  );

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  if (submenu) {
    return (
      <Popover 
        open={isOpen}
        onOpenChange={setIsOpen}
        placement="right-start"
      >
        <PopoverTrigger asChild>
          <button
            {...buttonProps}
            type="button"
            className={getMenuItemClassName(className, selected || isOpen)}
            aria-label={ariaLabel}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={isOpen}
          >
            {menuItemContent}
          </button>
        </PopoverTrigger>
        <PopoverContent onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {submenu}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      {...buttonProps}
      onClick={handleClick}
      type="button"
      className={getMenuItemClassName(className, selected)}
      aria-label={ariaLabel}
      role="menuitem"
    >
      {menuItemContent}
    </button>
  );
};
MenuItem.displayName = 'MenuItem';

export const DropDownMenuItemBadge = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        marginLeft: 'auto',
        padding: '2px 4px',
        background: 'var(--color-promo)',
        color: 'var(--color-surface-lowest)',
        borderRadius: 6,
        fontSize: 9,
        fontFamily: 'Cascadia, monospace',
      }}
    >
      {children}
    </div>
  );
};
DropDownMenuItemBadge.displayName = 'MenuItemBadge';

MenuItem.Badge = DropDownMenuItemBadge;

export default MenuItem;
