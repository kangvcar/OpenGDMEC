/**
 * 「填写 API Key」引导的请求通道
 *
 * utils/gemini-api/auth.ts 是非 React 模块，没法直接渲染弹窗，所以用事件
 * 把请求转交给 components/admin-contact/admin-key-guidance.tsx。
 *
 * 照 utils/api-auth-error-event.ts 的 dispatch/listen 约定，区别是多了一个
 * 回执：调用方要拿到老师填的 Key 才能继续。
 */

export const ADMIN_KEY_GUIDANCE_EVENT = 'admin-key-guidance-request';

export interface AdminKeyGuidanceRequestDetail {
  /** 老师提交或取消时回传 Key（取消为 null） */
  resolve: (apiKey: string | null) => void;
  /** 监听者标记自己接下了这次请求 */
  handled: boolean;
}

/**
 * 请求老师填写 API Key，返回 null 表示取消（语义与旧浮层一致）。
 *
 * `dispatchEvent` 是同步的，所以「有没有监听者」当场就能知道；引导组件没挂载
 * 时必须立刻 resolve(null)，否则调用方会永远卡在这个 Promise 上。
 */
export function requestAdminApiKey(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const detail: AdminKeyGuidanceRequestDetail = { resolve, handled: false };
    window.dispatchEvent(
      new CustomEvent<AdminKeyGuidanceRequestDetail>(ADMIN_KEY_GUIDANCE_EVENT, {
        detail,
      })
    );

    if (!detail.handled) {
      resolve(null);
    }
  });
}
