import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, setMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  setMock: vi.fn(async () => {}),
}));

vi.mock('../kv-storage-service', () => ({
  kvStorageService: {
    get: getMock,
    set: setMock,
    isAvailable: () => true,
  },
}));

/**
 * 教师发行版不暴露 AI 视频入口。'ai-video' 已从 ALL_BUTTON_IDS 移除，
 * 存量用户配置必须在迁移时被剔除，否则老用户会继续看到视频按钮。
 */
describe('toolbar-config-service（发行档位收敛）', () => {
  beforeEach(() => {
    vi.resetModules();
    getMock.mockReset();
    setMock.mockReset();
  });

  it('ALL_BUTTON_IDS 与默认配置都不含 ai-video', async () => {
    const { ALL_BUTTON_IDS, DEFAULT_VISIBLE_BUTTONS, getDefaultToolbarConfig } =
      await import('../../types/toolbar-config.types');

    expect(ALL_BUTTON_IDS).not.toContain('ai-video');
    expect(DEFAULT_VISIBLE_BUTTONS).not.toContain('ai-video');

    const buttons = getDefaultToolbarConfig().buttons;
    expect(buttons.map((button) => button.id)).not.toContain('ai-video');
  });

  it('存量自定义配置中的 ai-video 在迁移时被剔除，其余按钮保留', async () => {
    // 非 legacy 版本且布局与旧默认布局不同 —— 只走 ALL_BUTTON_IDS 过滤分支
    getMock.mockResolvedValue({
      version: 7,
      updatedAt: Date.now(),
      buttons: ['hand', 'selection', 'ai-image', 'ai-video', 'text'].map(
        (id, order) => ({ id, visible: true, order })
      ),
    });

    const { toolbarConfigService } = await import('../toolbar-config-service');
    const config = await toolbarConfigService.initializeAsync();
    const ids = config.buttons.map((button) => button.id);

    expect(ids).not.toContain('ai-video');
    expect(ids).toContain('hand');
    expect(ids).toContain('ai-image');
    expect(ids).toContain('text');
  });

  it('旧版默认布局会被重置为新默认配置', async () => {
    const legacyIds = [
      'hand',
      'selection',
      'text',
      'media-library',
      'ai-image',
      'ai-video',
      'mind',
      'freehand',
      'arrow',
      'shape',
      'image',
      'theme',
      'mermaid-to-drawnix',
      'markdown-to-drawnix',
      'undo',
      'redo',
      'zoom',
    ];
    const legacyVisible = legacyIds.slice(0, 6);

    getMock.mockResolvedValue({
      version: 1,
      updatedAt: Date.now(),
      buttons: legacyIds.map((id, order) => ({
        id,
        visible: legacyVisible.includes(id),
        order,
      })),
    });

    const { toolbarConfigService } = await import('../toolbar-config-service');
    const config = await toolbarConfigService.initializeAsync();

    expect(config.buttons.map((button) => button.id)).not.toContain('ai-video');
    expect(config.version).toBeGreaterThan(1);
  });
});
