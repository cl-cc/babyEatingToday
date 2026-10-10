# 团子食光 · Web 管理后台

后台在本地通过 Vite 开发服务器代调微信云函数 `adminApi`，不依赖云函数 HTTP 访问，也不依赖 Web 安全域名。免费 cloud1 控制台通常看不到这两项，属于正常情况。

网页只请求同源的 `/api/admin`。小程序 AppSecret 只留在本地 `.env.local`，不会进入浏览器，也不要提交到仓库。

## 本地启动

1. 复制环境变量：

```bash
cd backend
cp .env.example .env.local
```

2. 打开 [微信公众平台](https://mp.weixin.qq.com) → 开发 → 开发管理 → 开发者密码(AppSecret)，把密钥写入 `.env.local` 的 `WX_APP_SECRET`。

3. 启动：

```bash
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:5173`。改过 `.env.local` 后必须重启 `npm run dev`。

## 构建

```bash
npm run build
```

静态构建产物不能单独代调云函数，日常管理请用 `npm run dev`。

## 云函数侧仍需配置

1. `adminApi` 已部署到 `cloud1-d4grqnq96d763990e`。
2. 云函数环境变量：`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_TOKEN_SECRET`。
3. 不必再找 HTTP 访问，也不必找 Web 安全域名。
4. 「未登录访问」可以保持开启，新方案不再依赖它。不要改数据库集合权限。
