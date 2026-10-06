import { describe, expect, it } from 'vitest';
import {
  ADMIN_KEY_GUIDANCE_EVENT,
  requestAdminApiKey,
  type AdminKeyGuidanceRequestDetail,
} from '../admin-key-guidance-event';

describe('requestAdminApiKey', () => {
  it('没有监听者时立即返回 null，不把调用方挂住', async () => {
    await expect(requestAdminApiKey()).resolves.toBeNull();
  });

  it('监听者接单并回执后，返回老师填的 Key', async () => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AdminKeyGuidanceRequestDetail>).detail;
      detail.handled = true;
      detail.resolve('sk-from-teacher');
    };
    window.addEventListener(ADMIN_KEY_GUIDANCE_EVENT, handler);
    try {
      await expect(requestAdminApiKey()).resolves.toBe('sk-from-teacher');
    } finally {
      window.removeEventListener(ADMIN_KEY_GUIDANCE_EVENT, handler);
    }
  });

  it('接单但尚未提交时保持挂起，等弹窗回执才 resolve', async () => {
    const captured: AdminKeyGuidanceRequestDetail[] = [];
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AdminKeyGuidanceRequestDetail>).detail;
      // 这里只标记「已接单」，故意不 resolve —— 模拟老师还在填
      detail.handled = true;
      captured.push(detail);
    };
    window.addEventListener(ADMIN_KEY_GUIDANCE_EVENT, handler);

    try {
      const promise = requestAdminApiKey();
      let settled = false;
      promise.then(() => {
        settled = true;
      });

      // 让出微任务队列，确认「已接单」不会被误当成「无人处理」
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(settled).toBe(false);
      expect(captured).toHaveLength(1);

      captured[0].resolve('sk-typed-later');
      await expect(promise).resolves.toBe('sk-typed-later');
    } finally {
      window.removeEventListener(ADMIN_KEY_GUIDANCE_EVENT, handler);
    }
  });
});
