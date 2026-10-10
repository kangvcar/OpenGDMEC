/**
 * 发行档位：对外暴露的生成类型
 *
 * 教师发行版只暴露图片生成。视频与音频的**底层能力保留**
 * （异步图片生成复用 `/v1/videos` 接口，不可删除），
 * 但既不出现在任何 UI 入口，也不接受存量配置恢复成这些类型。
 *
 * 这里是该决策的唯一真相来源，新增/收敛生成类型时只改这一处。
 */
export const EXPOSED_GENERATION_TYPES = ['image', 'text', 'agent'] as const;

export type ExposedGenerationType = (typeof EXPOSED_GENERATION_TYPES)[number];

/**
 * 判断一个值是否为当前发行档位暴露的生成类型。
 * 用于在入口处收敛持久化/外部输入，避免被隐藏的类型从存量配置里复活。
 */
export function isExposedGenerationType(
  value: unknown
): value is ExposedGenerationType {
  return (
    typeof value === 'string' &&
    (EXPOSED_GENERATION_TYPES as readonly string[]).includes(value)
  );
}

/**
 * 界面语言：教师发行版只留中文。
 *
 * 英文词条只覆盖了上游的一部分组件（AI 输入栏、尺寸/参数下拉、画布提示等仍是
 * 硬编码中文），切过去得到的是半中半英的界面。与其给老师一个残缺的英文，不如
 * 不暴露入口。将来补齐英文词条后，把 'en' 加回来这一处即可。
 */
export const EXPOSED_UI_LANGUAGES = ['zh'] as const;

export type ExposedUiLanguage = (typeof EXPOSED_UI_LANGUAGES)[number];

/** 只有一种可选语言时，界面上不提供语言切换入口 */
export function isUiLanguageSwitchable(): boolean {
  return EXPOSED_UI_LANGUAGES.length > 1;
}
