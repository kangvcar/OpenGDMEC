const fs = require('fs');
const path = require('path');

// 获取当前版本号
function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

// 构建标识（Cloudflare Pages 构建时注入 commit SHA）。
// 只为让每次部署产出的 sw.js 字节不同——浏览器靠字节差异检测 Service Worker
// 更新，版本号不变就会认为"没有新版本"，用户永远卡在旧的应用外壳缓存里。
function getBuildId() {
  const sha = process.env.CF_PAGES_COMMIT_SHA;
  return typeof sha === 'string' && sha.length >= 7 ? sha.slice(0, 7) : null;
}

// 更新 Service Worker 中的版本号（已废弃，sw.js 现在是构建产物）
function updateServiceWorkerVersion(version) {
  // sw.js 现在是构建产物，不再需要手动更新
  // 版本信息会通过 version.json 和构建过程自动处理
  console.log(`ℹ️  Service Worker 版本将通过构建过程自动更新`);
}

// 创建版本信息文件（保留现有的 changelog）
function createVersionFile(version) {
  const versionPath = path.join(__dirname, '../apps/web/public/version.json');
  
  // 读取现有的 version.json，保留 changelog
  let existingChangelog = [];
  if (fs.existsSync(versionPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      // 只有当版本号相同时才保留 changelog
      if (existing.version === version && Array.isArray(existing.changelog)) {
        existingChangelog = existing.changelog;
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  const buildId = getBuildId();
  // version 必须保持纯净 semver：release-manage / safe-version-bump 都做严格比对。
  // buildVersion 才是喂给 vite define 的那份（见三个 vite config 的 appVersion）。
  const buildVersion = buildId ? `${version}+${buildId}` : version;

  const versionInfo = {
    version: version,
    buildVersion: buildVersion,
    buildId: buildId,
    buildTime: new Date().toISOString(),
    gitCommit: process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown',
    changelog: existingChangelog
  };

  fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
  console.log(`✅ Version file created: ${buildVersion}${existingChangelog.length > 0 ? ` (保留 ${existingChangelog.length} 条更新日志)` : ''}`);
}

// 更新 HTML 文件，添加版本号到资源链接
function updateHtmlWithVersion(version) {
  const htmlPath = path.join(__dirname, '../apps/web/index.html');
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // 在 manifest.json 后添加版本号查询参数
  htmlContent = htmlContent.replace(
    'href="/manifest.json"',
    `href="/manifest.json?v=${version}"`
  );
  
  // 更新或添加版本信息到 meta 标签
  if (htmlContent.includes('name="app-version"')) {
    // 更新现有的版本标签
    htmlContent = htmlContent.replace(
      /<meta name="app-version" content="[^"]*" \/>/g,
      `<meta name="app-version" content="${version}" />`
    );
  } else {
    // 添加新的版本标签
    const versionMeta = `    <meta name="app-version" content="${version}" />`;
    htmlContent = htmlContent.replace(
      '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
      `    <meta name="viewport" content="width=device-width, initial-scale=1" />\n${versionMeta}`
    );
  }
  
  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`✅ HTML updated with version ${version}`);
}

// 检查 changelog.json 是否包含当前版本
function checkChangelog(version) {
  const changelogPath = path.join(__dirname, '../apps/web/public/changelog.json');
  if (!fs.existsSync(changelogPath)) {
    console.log(`⚠️  changelog.json not found, skipping changelog check`);
    return;
  }
  try {
    const changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
    const hasEntry = (changelog.versions || []).some(v => v.version === version);
    if (!hasEntry) {
      console.log(`⚠️  Version ${version} has no entry in changelog.json — consider adding one`);
    } else {
      console.log(`✅ changelog.json has entry for ${version}`);
    }
  } catch (e) {
    console.log(`⚠️  Failed to parse changelog.json: ${e.message}`);
  }
}

// 主函数
function main() {
  const version = getCurrentVersion();
  
  console.log(`🚀 Updating app to version ${version}`);
  
  // updateServiceWorkerVersion(version);
  createVersionFile(version);
  updateHtmlWithVersion(version);
  checkChangelog(version);
  
  console.log(`🎉 Version update completed: ${version}`);
}

main();