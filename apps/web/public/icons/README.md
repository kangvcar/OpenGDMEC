# PWA 图标

图标统一由校徽 `../logo-gdmec.png` 生成（512×512 源图，四周留白）。

## 生成方式（macOS 自带 `sips`，无需额外依赖）

```bash
SRC=apps/web/public/logo-gdmec.png
OUT=apps/web/public/icons
TMP=$(mktemp -d)

# maskable 图标需要安全区：先缩到约 80%，再补白到正方形
sips -s format png -z 410 408 "$SRC" --out "$TMP/scaled.png"
sips -p 512 512 "$TMP/scaled.png" --out "$TMP/square.png"

cp "$TMP/square.png" "$OUT/android-chrome-512x512.png"
sips -z 192 192 "$TMP/square.png" --out "$OUT/android-chrome-192x192.png"
sips -z 180 180 "$TMP/square.png" --out "$OUT/apple-touch-icon.png"
sips -z 96  96  "$TMP/square.png" --out "$OUT/icon-96x96.png"
sips -z 32  32  "$TMP/square.png" --out "$OUT/favicon-32x32.png"
sips -z 16  16  "$TMP/square.png" --out "$OUT/favicon-16x16.png"
```

`public/favicon.ico` 是 16/32/64 三尺寸的多图标 ICO，需单独打包（直接内嵌 PNG 数据即可，
浏览器与 `PRECACHE_ALWAYS_INCLUDE` 都会请求它）。

## 当前文件

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `android-chrome-512x512.png` | 512 | PWA maskable |
| `android-chrome-192x192.png` | 192 | PWA maskable / favicon |
| `apple-touch-icon.png` | 180 | iOS 主屏 |
| `icon-96x96.png` | 96 | manifest shortcut |
| `favicon-32x32.png` | 32 | 浏览器标签页 |
| `favicon-16x16.png` | 16 | 浏览器标签页 |
| `../favicon.ico` | 16/32/64 | 默认 favicon 回退 |
