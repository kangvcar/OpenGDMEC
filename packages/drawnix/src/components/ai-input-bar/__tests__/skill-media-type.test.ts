import { describe, expect, it } from 'vitest';
import {
  inferSkillMediaTypes,
  normalizeSkillOutputType,
} from '../skill-media-type';

/**
 * 教师发行版只暴露图片生成，视频/音频的媒体模型选择器不对外暴露。
 * 因此这里断言的是**收敛后**的行为：推断出的 video/audio 一律被过滤掉。
 */
describe('skill-media-type（发行档位收敛）', () => {
  it('PPT 大纲 Skill 不触发媒体模型选择', () => {
    expect(normalizeSkillOutputType('ppt')).toBeUndefined();
    expect(inferSkillMediaTypes({ outputType: 'ppt' })).toEqual([]);
  });

  it('视频输出类型被收敛掉，不产生媒体模型选择', () => {
    expect(
      inferSkillMediaTypes({
        outputType: 'video',
        content: '调用 generate_image',
      })
    ).toEqual([]);
  });

  it('音频工具被收敛掉', () => {
    expect(inferSkillMediaTypes({ mcpTool: 'generate_audio' })).toEqual([]);
  });

  it('混合内容只保留图片，视频被过滤', () => {
    expect(
      inferSkillMediaTypes({
        content: '先调用 generate_image，再调用 generate_video',
      })
    ).toEqual(['image']);
  });

  it('图片输出类型不受影响', () => {
    expect(inferSkillMediaTypes({ outputType: 'image' })).toEqual(['image']);
  });
});
