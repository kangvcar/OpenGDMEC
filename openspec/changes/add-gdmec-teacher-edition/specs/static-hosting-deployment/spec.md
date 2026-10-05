## ADDED Requirements

### Requirement: 构建产物可直接部署到纯静态托管

构建产物 SHALL 为纯静态资源，SHALL NOT 依赖任何后端服务、Serverless function 或边缘 Worker 才能完成核心生成流程。生图请求 SHALL 由浏览器直连网关，SHALL NOT 依赖同源反向代理。

#### Scenario: 无外部代理规则
- **WHEN** 检查部署配置（`_redirects`、`netlify.toml`、`vercel.json`）
- **THEN** SHALL NOT 存在指向外部域名的 200 代理规则

#### Scenario: 生图请求浏览器直连
- **WHEN** 教师发起图片生成
- **THEN** 请求 SHALL 直接发往网关域名，SHALL NOT 经由站点自身的代理路径转发

#### Scenario: 产物不含服务端组件
- **WHEN** 检查构建输出目录
- **THEN** SHALL NOT 存在需要 `functions/`、`_worker.js` 或 Node 运行时才能生效的组件

### Requirement: 站点支持 SPA 路由回退

静态托管 SHALL 配置单页应用路由回退，使深层路径直接访问时返回应用入口。

#### Scenario: 深层路由直接访问
- **WHEN** 教师直接在浏览器打开一个深层路由地址
- **THEN** 站点 SHALL 返回应用入口页面并由前端路由接管，SHALL NOT 返回 404

### Requirement: 安全响应头以托管商无关形式声明

站点的安全响应头（含 CSP）SHALL 通过静态托管可识别的方式声明，使其在更换托管商时可低成本迁移。

#### Scenario: CSP 通过静态头文件生效
- **WHEN** 教师访问站点并检查响应头
- **THEN** CSP 等安全头 SHALL 按声明生效，且其声明方式 SHALL NOT 绑定到单一托管商专有配置

### Requirement: 更换托管商不需要修改业务代码

切换静态托管商 SHALL 只涉及重新上传构建产物与调整托管配置，SHALL NOT 需要修改业务代码或重新构建。

#### Scenario: 更换托管只替换产物
- **WHEN** 将同一份构建产物从 Cloudflare Pages 迁移到国内对象存储
- **THEN** SHALL 只需要上传产物并配置域名解析，SHALL NOT 需要改动业务代码

#### Scenario: 切换域名后缓存自然隔离
- **WHEN** 站点在新的域名下首次被访问
- **THEN** Service Worker SHALL 在新 origin 下重新注册并建立缓存，SHALL NOT 复用旧域名的缓存状态
