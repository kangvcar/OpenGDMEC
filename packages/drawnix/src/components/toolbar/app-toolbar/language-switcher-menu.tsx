import { useContext } from 'react';
import { MenuIcon } from '../../icons';
import { useI18n } from '../../../i18n';
import Menu from '../../menu/menu';
import MenuItem from '../../menu/menu-item';
import { MenuContentPropsContext } from '../../menu/common';
import { EVENT } from '../../../constants';
import { isUiLanguageSwitchable } from '../../../constants/distribution';

export const LanguageSwitcherMenu = () => {
  const { language, setLanguage, t } = useI18n();
  const menuContentProps = useContext(MenuContentPropsContext);

  // 教师发行版只留中文：英文只覆盖了一部分组件，切过去是半中半英的界面，
  // 索性不暴露入口（见 constants/distribution.ts）。
  if (!isUiLanguageSwitchable()) {
    return null;
  }

  return (
    <MenuItem
      icon={<MenuIcon />}
      data-testid="language-switcher-button"
      onSelect={() => {
        // This will be handled by the submenu
      }}
      submenu={
        <Menu onSelect={() => {
          const itemSelectEvent = new CustomEvent(EVENT.MENU_ITEM_SELECT, {
            bubbles: true,
            cancelable: true,
          });
          menuContentProps.onSelect?.(itemSelectEvent);
        }}>
          <MenuItem
            onSelect={() => {
              setLanguage('zh');
            }}
            aria-label={t('language.chinese')}
            selected={language === 'zh'}
          >
            {t('language.chinese')}
          </MenuItem>
          <MenuItem
            onSelect={() => {
              setLanguage('en');
            }}
            aria-label={t('language.english')}
            selected={language === 'en'}
          >
            {t('language.english')}
          </MenuItem>
        </Menu>
      }
      aria-label={t('language.switcher')}
    >
      {t('language.switcher')}
    </MenuItem>
  );
};

LanguageSwitcherMenu.displayName = 'LanguageSwitcherMenu';