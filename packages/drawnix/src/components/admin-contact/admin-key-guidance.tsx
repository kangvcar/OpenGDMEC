/**
 * 获取 / 填写 API Key 的引导弹窗
 *
 * 只由用户动作打开，两个入口共用一个弹窗：
 * 1. 提交时被拦下 —— utils/gemini-api/auth.ts 的 requestAdminApiKey 派发事件，
 *    走的是「有回执」模式：老师填完，调用方拿到 Key 才继续发请求；
 * 2. 工具栏的企业微信图标。
 *
 * 刻意不做启动自动弹窗：老师还没做任何操作就弹出二维码，实测观感像广告。
 * 未配 Key 的状态只由输入栏的一行提示表达，需要时才点开这里。
 *
 * 为什么保留就地粘贴：让不熟悉后台的老师去「设置 → 供应商」里找输入框，
 * 反而比在这里直接粘贴更容易卡住。设置页仍然是正规入口，二者写入同一份配置。
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dialog, Input } from 'tdesign-react';
import { geminiSettings } from '../../utils/settings-manager';
import {
  ADMIN_KEY_GUIDANCE_EVENT,
  type AdminKeyGuidanceRequestDetail,
} from '../../utils/admin-key-guidance-event';
import {
  ADMIN_CONTACT_TEXT,
  ADMIN_QR_URL,
} from '../../constants/admin-contact';
import { INSTITUTION_CREDIT_TEXT } from '../../constants/institution-credit';
import './admin-key-guidance.scss';

export const AdminKeyGuidance: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // 两个入口都走同一个事件通道，所以总有一个调用方在等回执。
  // 提交被拦下那条会拿 Key 继续发请求；工具栏图标只是打开弹窗，
  // 拿到什么都无所谓，取消时回 null。
  const pendingResolveRef = useRef<((apiKey: string | null) => void) | null>(null);

  const settle = useCallback((value: string | null) => {
    const resolve = pendingResolveRef.current;
    pendingResolveRef.current = null;
    resolve?.(value);
  }, []);

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const detail = (event as CustomEvent<AdminKeyGuidanceRequestDetail>).detail;
      if (!detail) {
        return;
      }
      // 连着点两次发送：上一个请求按取消放掉，避免它的 Promise 永远挂着
      settle(null);
      pendingResolveRef.current = detail.resolve;
      detail.handled = true;
      setApiKey('');
      setError('');
      setVisible(true);
    };

    window.addEventListener(ADMIN_KEY_GUIDANCE_EVENT, handleRequest);
    return () => {
      window.removeEventListener(ADMIN_KEY_GUIDANCE_EVENT, handleRequest);
      // 卸载时把挂着的调用方放掉，否则它会一直等回执
      settle(null);
    };
  }, [settle]);

  const handleDismiss = useCallback(() => {
    settle(null);
    setVisible(false);
    setApiKey('');
    setError('');
  }, [settle]);

  const handleSubmit = useCallback(async () => {
    const value = apiKey.trim();
    if (!value) {
      setError('请先粘贴管理员发给你的 Key');
      return;
    }

    setSaving(true);
    try {
      // 与设置页写的是同一份配置，内部会 await 同步到 IndexedDB
      await geminiSettings.update({ apiKey: value });
    } catch (err) {
      console.debug('[AdminKeyGuidance] 保存 API Key 失败', err);
      setError('保存失败，请重试');
      setSaving(false);
      return;
    }

    setSaving(false);
    settle(value);
    setVisible(false);
    setApiKey('');
    setError('');
  }, [apiKey, settle]);

  return (
    <Dialog
      header="配置 API Key"
      visible={visible}
      onClose={handleDismiss}
      width={520}
      // 默认「贴顶 + 20vh」在手机上会把页脚按钮顶到屏幕外（弹窗 603px，
      // 从 y=149 起就超出一屏）。居中后按视口高度自适应，手机上按钮才点得到。
      // tdesign-theme.scss 里给移动端写的整屏规则只匹配 --mode-modal，
      // TDesign 默认弹窗类是 --default，那批规则对这个弹窗不生效。
      placement="center"
      footer={
        // 署名放页脚左侧：压在正文底部一整行居中，是传单的排法
        <div className="admin-key-guidance__footer">
          <span className="admin-key-guidance__credit">
            {INSTITUTION_CREDIT_TEXT}
          </span>
          <div className="admin-key-guidance__actions">
            <Button theme="default" variant="outline" onClick={handleDismiss}>
              稍后再说
            </Button>
            <Button
              theme="primary"
              loading={saving}
              disabled={!apiKey.trim()}
              // TDesign 的 disabled 按钮默认渲染成 <div>（为了让浮层能弹），
              // 会丢掉 button 语义也选不中；显式指定回 <button>
              tag="button"
              onClick={handleSubmit}
            >
              保存并开始
            </Button>
          </div>
        </div>
      }
    >
      <div className="admin-key-guidance">
        <div className="admin-key-guidance__qr">
          <img
            className="admin-key-guidance__qr-img"
            src={ADMIN_QR_URL}
            alt="管理员微信二维码"
          />
          <span className="admin-key-guidance__qr-caption">微信扫码</span>
        </div>

        <div className="admin-key-guidance__steps">
          <div className="admin-key-guidance__step">
            <span className="admin-key-guidance__step-no">1</span>
            <div className="admin-key-guidance__step-body">
              <p className="admin-key-guidance__step-title">扫码添加管理员</p>
              <p className="admin-key-guidance__step-desc">
                {ADMIN_CONTACT_TEXT}
              </p>
            </div>
          </div>

          <div className="admin-key-guidance__step">
            <span className="admin-key-guidance__step-no">2</span>
            <div className="admin-key-guidance__step-body">
              <p className="admin-key-guidance__step-title">
                把收到的 Key 粘贴到下面
              </p>
              <div className="admin-key-guidance__field">
                <Input
                  value={apiKey}
                  onChange={(value) => {
                    setApiKey(String(value));
                    setError('');
                  }}
                  onEnter={handleSubmit}
                  placeholder="例如 sk-..."
                  autofocus
                  status={error ? 'error' : undefined}
                />
                {error ? (
                  <p className="admin-key-guidance__error">{error}</p>
                ) : (
                  <p className="admin-key-guidance__step-note">
                    粘贴后保存即可开始使用
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
