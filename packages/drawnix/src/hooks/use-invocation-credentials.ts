import { useEffect, useState } from 'react';
import type { ModelType } from '../constants/model-config';
import { runtimeModelDiscovery } from '../utils/runtime-model-discovery';
import {
  hasInvocationRouteCredentials,
  settingsManager,
} from '../utils/settings-manager';

/**
 * 「这个生成类型现在有没有可用凭据」的响应式版本。
 *
 * 用它决定模型下拉要不要显示，而不是用 useConfiguredSelectableModels(type).length：
 * 后者取的是 runtime model discovery 的 catalogStates，需要一次 /models 发现往返才有
 * 内容。老师把 Key 粘进引导弹窗后它仍然是空的（实测存 Key 后 25 秒、刷新后都一样），
 * 模型下拉会永远不出现 —— 那等于把这个发行版唯一的模型选择入口藏掉了。
 *
 * hasInvocationRouteCredentials 正是提交生成时用的同一判据，它为真就说明「现在点发送
 * 能跑通」，此时把模型下拉露出来才是诚实的。
 */
export function useHasInvocationCredentials(routeType: ModelType): boolean {
  const [hasCredentials, setHasCredentials] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (cancelled) {
        return;
      }
      setHasCredentials(hasInvocationRouteCredentials(routeType));
    };

    // 凭据是加密存的，初始化完成前读到的是密文，会把「已配」误判成「没配」
    settingsManager
      .waitForInitialization()
      .then(refresh)
      .catch((err) => {
        console.debug('[useHasInvocationCredentials] 设置初始化失败', err);
      });

    // 两条事件都要订阅：引导弹窗存 Key 走 gemini-settings-changed，
    // 设置里的供应商档案变更走 discovery revision。
    window.addEventListener('gemini-settings-changed', refresh);
    const unsubscribeDiscovery = runtimeModelDiscovery.subscribe(refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('gemini-settings-changed', refresh);
      unsubscribeDiscovery();
    };
  }, [routeType]);

  return hasCredentials;
}
