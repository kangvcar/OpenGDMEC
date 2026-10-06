/**
 * Gemini API 认证和配置管理
 */

import { GeminiConfig } from './types';
import { geminiSettings } from '../settings-manager';
import { isTuziEmbeddedMode } from '../../services/tuzi-embedded-config';
import { requestAdminApiKey } from '../admin-key-guidance-event';

/**
 * 请求填写 API Key。
 *
 * 教师发行版把手搓的 DOM 浮层换成了带品牌感的引导弹窗（二维码 + 输入框），
 * 见 components/admin-contact/admin-key-guidance.tsx。弹窗在老师提交时已经把
 * Key 写入 gemini 设置，这里只负责把值回传给调用方。
 *
 * 返回 null 表示"本次没有拿到 Key"，调用方据此中止操作 —— 与旧实现
 * 用户取消时的语义完全一致。
 */
export function promptForApiKey(): Promise<string | null> {
  return requestAdminApiKey();
}

/**
 * 验证并确保配置有效，如果缺少 API Key 则弹窗获取
 */
export async function validateAndEnsureConfig(
  config: GeminiConfig
): Promise<GeminiConfig> {
  // 检查 baseUrl
  if (!config.baseUrl) {
    throw new Error('Base URL 是必需的');
  }

  // 检查 apiKey，优先从全局设置获取
  if (!config.apiKey) {
    // 首先尝试从全局设置获取
    const globalSettings = geminiSettings.get();
    if (globalSettings.apiKey) {
      // 更新原始config对象
      config.apiKey = globalSettings.apiKey;
      return config;
    }

    // 如果全局设置中也没有，则弹窗获取
    const newApiKey = await promptForApiKey();
    if (!newApiKey) {
      throw new Error('API Key 是必需的，操作已取消');
    }

    // 更新原始config对象
    config.apiKey = newApiKey;
    return config;
  }

  return config;
}

/**
 * 检查字符串是否是占位符格式
 * 如 {key}、${key}、{{key}}、{apiKey} 等
 */
function isPlaceholder(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  // 匹配 {xxx}、${xxx}、{{xxx}} 等占位符格式
  return (
    /^[{$]*\{?\w+\}?\}*$/.test(value) ||
    value.includes('{key}') ||
    value.includes('${')
  );
}

/**
 * 从URL参数中获取apiKey
 */
function getApiKeyFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  if (isTuziEmbeddedMode()) return null;

  const urlParams = new URLSearchParams(window.location.search);
  const apiKey = urlParams.get('apiKey');

  // 验证 apiKey 不是占位符格式
  if (isPlaceholder(apiKey)) {
    console.warn(
      '[Auth] Detected placeholder in URL apiKey, ignoring:',
      apiKey
    );
    return null;
  }

  return apiKey;
}

/**
 * 从URL参数中获取settings配置
 */
function getSettingsFromUrl(): { apiKey?: string; baseUrl?: string } | null {
  if (typeof window === 'undefined') return null;
  if (isTuziEmbeddedMode()) return null;

  const urlParams = new URLSearchParams(window.location.search);
  const settingsParam = urlParams.get('settings');

  if (!settingsParam) return null;

  try {
    const decoded = decodeURIComponent(settingsParam);
    const settings = JSON.parse(decoded);

    // 验证 apiKey 不是占位符格式
    const apiKey = isPlaceholder(settings.key) ? undefined : settings.key;
    if (settings.key && isPlaceholder(settings.key)) {
      console.warn(
        '[Auth] Detected placeholder in settings.key, ignoring:',
        settings.key
      );
    }

    return {
      apiKey,
      baseUrl: settings.url,
    };
  } catch (error) {
    console.warn('Failed to parse settings parameter:', error);
    return null;
  }
}

/**
 * 从URL中移除apiKey参数
 */
function removeApiKeyFromUrl(): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  let hasChanges = false;

  if (url.searchParams.has('apiKey')) {
    url.searchParams.delete('apiKey');
    hasChanges = true;
  }

  if (url.searchParams.has('settings')) {
    url.searchParams.delete('settings');
    hasChanges = true;
  }

  if (hasChanges) {
    window.history.replaceState({}, document.title, url.toString());
  }
}

/**
 * 初始化设置：从URL获取settings参数并处理
 */
export function initializeSettings(): void {
  if (isTuziEmbeddedMode()) {
    removeApiKeyFromUrl();
    return;
  }
  // 处理settings参数
  const settings = getSettingsFromUrl();
  // 处理单独的apiKey参数
  const apiKey = getApiKeyFromUrl();

  if (settings?.apiKey || settings?.baseUrl || apiKey) {
    geminiSettings.update({
      ...(settings?.apiKey && { apiKey: settings.apiKey }),
      ...(settings?.baseUrl && { baseUrl: settings.baseUrl }),
      ...(apiKey && { apiKey: apiKey }),
    });

    // Remove parameters from URL after processing
    const url = new URL(window.location.href);
    if (settings?.apiKey || settings?.baseUrl) {
      url.searchParams.delete('settings');
    }
    if (apiKey) {
      url.searchParams.delete('apiKey');
    }
    window.history.replaceState({}, '', url.toString());
  }
}

// Initialize settings from URL if present
if (typeof window !== 'undefined') {
  if (isTuziEmbeddedMode()) {
    removeApiKeyFromUrl();
  } else {
    // 处理settings参数
    const settings = getSettingsFromUrl();
    // 处理单独的apiKey参数
    const apiKey = getApiKeyFromUrl();

    if (settings?.apiKey || settings?.baseUrl || apiKey) {
      geminiSettings.update({
        ...(settings?.apiKey && { apiKey: settings.apiKey }),
        ...(settings?.baseUrl && { baseUrl: settings.baseUrl }),
        ...(apiKey && { apiKey: apiKey }),
      });
      removeApiKeyFromUrl();
    }
  }
}
