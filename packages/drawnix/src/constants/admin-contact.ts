/**
 * 管理员联系方式（教师发行版）
 *
 * 反馈按钮的二维码与「未配置 API Key」引导弹窗共用这一份文案和资产，
 * 避免同一句话、同一个二维码在两处各写一遍。
 *
 * 二维码资产位于 apps/web/public/admin-qr.png，用根绝对路径引用，
 * 与 utils/settings-manager.ts 的 TUZI_PROVIDER_ICON_URL 保持同一约定。
 */
export const ADMIN_CONTACT_TEXT = '校内教师可联系管理员获取免费额度';
export const ADMIN_QR_URL = '/admin-qr.png';
