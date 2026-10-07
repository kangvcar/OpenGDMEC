export * from './board';
export * from './plugins/board';
export * from './wrapper';
export * from './hooks/use-board';
// 具名导出（不用 export *）：这是应用层判断「当前视口在哪」的唯一真值来源，
// 从滚动容器反推，比 board.viewport.origination 可靠（后者在滚动被夹取时会过期）
export { getCurrentViewportOrigination } from './utils/viewport';