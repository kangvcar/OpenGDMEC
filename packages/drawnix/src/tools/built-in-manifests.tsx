import React from 'react';
import { Images, History } from 'lucide-react';
import { BookOpenIcon } from '../components/icons';
import { ToolCategory, type ToolDefinition } from '../types/toolbox.types';
import { COMIC_CREATOR_TOOL_ID } from './tool-ids';

const DEFAULT_TOOL_PERMISSIONS = [
  'allow-scripts',
  'allow-same-origin',
  'allow-popups',
  'allow-forms',
  'allow-top-navigation-by-user-activation',
] as const;

/**
 * 教师发行版工具目录 —— 这是工具箱的唯一真相来源。
 *
 * 只保留四个工具。其余内置工具（批量出图、爆款音乐生成、Chat-MJ、生图巡检报表、
 * 模型测试、动作场景库、音乐播放器，以及更早移除的视频分析 / MV 生成）的
 * 组件实现都保留在 components/ 下，只是不再出现在目录里，因此不进工具箱。
 *
 * 注意：音乐播放器另有独立启动器（services/tool-launch-service.ts），
 * 画布音频播放与 TTS 仍会用它，摘掉目录条目不影响播放能力。
 */
export const BUILT_IN_TOOL_MANIFESTS: ToolDefinition[] = [
  {
    id: COMIC_CREATOR_TOOL_ID,
    name: '多图生成',
    description:
      '适合故事分镜、教程步骤、产品手册、营销图文等多页图片，一键规划提示词、批量出图并导出 ZIP/PPTX/PDF',
    icon: <Images size={18} strokeWidth={1.75} />,
    category: ToolCategory.AI_TOOLS,
    component: COMIC_CREATOR_TOOL_ID,
    supportsMultipleWindows: true,
    defaultWindowBehavior: {
      autoPinOnOpen: true,
    },
    defaultWidth: 720,
    defaultHeight: 760,
  },
  {
    id: 'prompt-history',
    name: '我的提示词',
    description: '按任务分类管理初始提示词、发送提示词和生成结果预览',
    icon: <History size={18} strokeWidth={1.75} />,
    category: ToolCategory.CONTENT_TOOLS,
    component: 'prompt-history',
    defaultWidth: 1120,
    defaultHeight: 680,
  },
  {
    id: 'banana-prompt',
    name: '香蕉提示词',
    description: '查看和复制优质 AI 提示词',
    icon: '🍌',
    category: ToolCategory.CONTENT_TOOLS,
    url: 'https://www.aiwind.org',
    defaultWidth: 800,
    defaultHeight: 600,
    permissions: [...DEFAULT_TOOL_PERMISSIONS],
  },
  {
    id: 'knowledge-base',
    name: '知识库',
    description: '个人知识管理工具，支持目录分类、标签管理和 Markdown 编辑',
    icon: React.createElement(BookOpenIcon),
    category: ToolCategory.UTILITIES,
    component: 'knowledge-base',
    defaultWidth: 900,
    defaultHeight: 700,
  },
];
