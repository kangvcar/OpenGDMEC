import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Dialog } from 'tdesign-react';
import { RefreshCw } from 'lucide-react';
import { ToolButton } from '../../tool-button';
import { useTaskQueue } from '../../../hooks/useTaskQueue';
import { useI18n } from '../../../i18n';

interface PendingUpdate {
  version: string;
  changelog: string[];
}

/** 1.1.21+4cb50d4 -> 1.1.21，构建标识只用于区分同版本号的不同部署 */
const formatVersion = (version: string) => version.split('+')[0];
/** 1.1.21+4cb50d4 -> 4cb50d4 */
const getBuildId = (version: string) => version.split('+')[1] || null;

interface VersionUpdateButtonProps {
  embedded?: boolean;
  /**
   * `collapsed` 是移动端收起态工具栏里那排圆按钮的样式。
   *
   * 收起态是老师手机上的默认状态（unified-toolbar 里 `useState(true)`），而固定顶部
   * 那个 section 在收起态是 `display: none` —— 只放在工具栏里的话，手机上没有任何
   * 可见入口提示「有新版本」，老师就一直跑在旧版本上（已修的问题被反复反馈）。
   */
  variant?: 'toolbar' | 'collapsed';
}

/**
 * 工具栏里的"新版本已就绪"入口。
 *
 * 事件链路：SW 预缓存完成 -> 广播 sw:newVersionReady -> bootstrap 派发
 * `sw-update-available` -> 这里亮起图标 -> 用户点击 -> 派发
 * `user-confirmed-upgrade` -> bootstrap 让新 SW 接管并刷新页面。
 */
export const VersionUpdateButton: React.FC<VersionUpdateButtonProps> = ({
  embedded,
  variant = 'toolbar',
}) => {
  const { t } = useI18n();
  const { activeTasks } = useTaskQueue();
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = (event: Event) => {
      const version = (event as CustomEvent).detail?.version;
      if (typeof version !== 'string' || !version) {
        return;
      }

      // changelog 只是锦上添花，取不到也要让入口出现
      fetch(`./version.json?t=${Date.now()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setPendingUpdate({
            version,
            changelog: Array.isArray(data?.changelog) ? data.changelog : [],
          });
        })
        .catch(() => {
          setPendingUpdate({ version, changelog: [] });
        });
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);
    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = useCallback(() => {
    setDialogVisible(false);
    window.dispatchEvent(new CustomEvent('user-confirmed-upgrade'));
  }, []);

  // 有任务在跑时不打扰：等它们跑完 activeTasks 变化会自动重新渲染出入口
  if (!pendingUpdate || activeTasks.length > 0) {
    return null;
  }

  const displayVersion = formatVersion(pendingUpdate.version);
  const buildId = getBuildId(pendingUpdate.version);
  const updateLabel = t('versionUpdate.tooltip').replace(
    '{version}',
    displayVersion
  );

  return (
    <>
      {/* TDesign 的 Badge 在无 count 时一律隐藏，dot 模式也必须给 count */}
      {variant === 'collapsed' ? (
        <button
          className="unified-toolbar__collapsed-btn"
          aria-label={updateLabel}
          data-track="toolbar_click_version_update_collapsed"
          data-testid="toolbar-version-update-collapsed"
          onClick={() => setDialogVisible(true)}
        >
          <Badge dot count={1} offset={[4, -4]}>
            <RefreshCw size={22} />
          </Badge>
        </button>
      ) : (
        <Badge dot count={1} offset={[6, -6]}>
          <ToolButton
            type="icon"
            icon={<RefreshCw size={18} />}
            visible={true}
            selected={dialogVisible}
            aria-label={updateLabel}
            tooltip={updateLabel}
            tooltipPlacement={embedded ? 'right' : 'bottom'}
            data-track="toolbar_click_version_update"
            data-testid="toolbar-version-update"
            onPointerDown={(e) => {
              e.event.stopPropagation();
            }}
            onClick={() => setDialogVisible(true)}
          />
        </Badge>
      )}

      {dialogVisible && (
        <Dialog
          header={`${t('versionUpdate.dialogTitle')} v${displayVersion}`}
          visible={true}
          onClose={() => setDialogVisible(false)}
          width={600}
          footer={
            <Button theme="primary" onClick={handleUpdate}>
              {t('versionUpdate.updateNow')}
            </Button>
          }
        >
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
            {buildId && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--td-text-color-placeholder)',
                  marginBottom: '8px',
                }}
              >
                {t('versionUpdate.buildInfo')} {buildId}
              </div>
            )}
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {pendingUpdate.changelog.map((item, index) => (
                <li key={index} style={{ marginBottom: '4px', lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Dialog>
      )}
    </>
  );
};
