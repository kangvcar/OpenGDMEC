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
