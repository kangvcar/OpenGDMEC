import { describe, expect, it } from 'vitest';
import {
  GIST_DESCRIPTION,
  isSyncGistDescription,
} from '../types';

describe('isSyncGistDescription', () => {
  it('认当前品牌的描述', () => {
    expect(isSyncGistDescription(GIST_DESCRIPTION)).toBe(true);
  });

  it('认改品牌前的 Opentu 描述，避免存量云端数据被孤立', () => {
    expect(isSyncGistDescription('Opentu - 数据同步')).toBe(true);
  });

  it('不认无关描述和空值', () => {
    expect(isSyncGistDescription('随便写的 gist')).toBe(false);
    expect(isSyncGistDescription(null)).toBe(false);
    expect(isSyncGistDescription(undefined)).toBe(false);
  });
});
