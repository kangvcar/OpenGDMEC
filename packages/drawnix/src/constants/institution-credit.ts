/**
 * 机构署名
 *
 * 口径为「联合支持」而非「主办/出品」：校徽是学校的，这里并列的是两个二级单位，
 * 用「支持」表述不会让读者把二级单位误读为责任主体。改口径时需同步这几处，
 * 因为它们分属两种技术栈、无法共享常量：
 *
 * - React：components/admin-contact/admin-key-guidance.tsx（引导弹窗）
 *          components/feedback-button/feedback-button.tsx（反馈 Popover）
 *          components/canvas-watermark/CanvasWatermark.tsx（画布水印）
 * - 静态 HTML：apps/web/index.html（启动屏 .app-boot-credit）
 *              apps/web/public/versions.html（页脚）
 */
export const INSTITUTION_CREDIT_TEXT = '人工智能学院 · 教师发展中心 联合支持';
