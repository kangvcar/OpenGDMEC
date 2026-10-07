/**
 * 获取 / 填写 API Key 的引导弹窗
 *
 * 只由用户动作打开，三种入口共用一个弹窗：
 * 1. 提交时被拦下 —— utils/gemini-api/auth.ts 的 requestAdminApiKey 派发事件，
 *    走的是「有回执」模式：老师填完，调用方拿到 Key 才继续发请求；
 * 2. 工具栏的企业微信图标；
 * 3. 空画布上的引导卡片。
 *
 * 刻意不做启动自动弹窗：老师还没做任何操作就弹出二维码，实测观感像广告。
 * 未配 Key 的状态交给输入栏的一行提示和空画布卡片去表达，需要时才点开这里。
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

  // 三条入口都走同一个事件通道，所以总有一个调用方在等回执。
  // 提交被拦下那条会拿 Key 继续发请求；工具栏图标和画布卡片只是打开弹窗，
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
      header="如何获取 API Key"
      visible={visible}
      onClose={handleDismiss}
      width={440}
      footer={
        <>
          <Button theme="default" variant="outline" onClick={handleDismiss}>
            稍后再说
          </Button>
          <Button theme="primary" loading={saving} onClick={handleSubmit}>
            保存并开始
          </Button>
        </>
      }
    >
      <div className="admin-key-guidance">
        <div className="admin-key-guidance__qr-card">
          <img
            className="admin-key-guidance__qr"
            src={ADMIN_QR_URL}
            alt="管理员二维码"
          />
        </div>
        <p className="admin-key-guidance__text">{ADMIN_CONTACT_TEXT}</p>
        <p className="admin-key-guidance__hint">
          微信扫码添加管理员，领取免费额度
        </p>
        <p className="admin-key-guidance__credit">{INSTITUTION_CREDIT_TEXT}</p>

        <div className="admin-key-guidance__divider">已有 Key？直接粘贴</div>

        <div className="admin-key-guidance__field">
          <Input
            value={apiKey}
            onChange={(value) => {
              setApiKey(String(value));
              setError('');
            }}
            onEnter={handleSubmit}
            placeholder="粘贴管理员发给你的 Key，例如 sk-..."
            size="large"
            autofocus
            status={error ? 'error' : undefined}
          />
          {error && <p className="admin-key-guidance__error">{error}</p>}
        </div>
      </div>
    </Dialog>
  );
};
