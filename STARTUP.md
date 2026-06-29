# html-anything 启动指南

**位置**: `C:\Users\65660\projects\html-anything`（纯本地，避开 OneDrive 同步）

## 启动

**按你用的 shell 选一个** —— `CLAUDECODE=''` 是 Unix 语法，Windows cmd / PowerShell 不认。

### Git Bash（推荐）
```bash
cd /c/Users/65660/projects/html-anything
CLAUDECODE='' pnpm -F @html-anything/next dev
```

### Windows cmd
```cmd
cd C:\Users\65660\projects\html-anything
set "CLAUDECODE=" && pnpm -F @html-anything/next dev
```

### PowerShell
```powershell
cd C:\Users\65660\projects\html-anything
$env:CLAUDECODE=''; pnpm -F @html-anything/next dev
```

然后浏览器打开 **http://localhost:3000**。

> ⚠️ 必须把 `CLAUDECODE` 清空（任意 shell 都要做），否则从 Claude Code 会话里启动会触发
> "Claude Code cannot be launched inside another Claude Code session" 错误
> （Claude Code v2.1.63+ 的嵌套会话保护）

### 输出 token 上限（一般不用管）
Claude Code CLI 默认把单次输出卡在 32,000 tokens。长 HTML 报告（多图表 + 多表格 + 完整 KEC 样式）经常超过这个数。`next/src/lib/agents/argv.ts#envFor` 已经在 spawn 子进程时自动设置了 `CLAUDE_CODE_MAX_OUTPUT_TOKENS=64000`，覆盖大多数场景。

如果再撞到 "exceeded the 32000 output token maximum" 报错，可以手动拉到更大：
```bash
# Git Bash
CLAUDE_CODE_MAX_OUTPUT_TOKENS=128000 pnpm -F @html-anything/next dev
```
```cmd
:: cmd — 注意：必须先关掉 dev server 再重启才能让 env 生效
set "CLAUDE_CODE_MAX_OUTPUT_TOKENS=128000" && pnpm -F @html-anything/next dev
```
```powershell
$env:CLAUDE_CODE_MAX_OUTPUT_TOKENS='128000'; pnpm -F @html-anything/next dev
```

## 关闭

后台 dev 跑着的时候，可以 `Ctrl+C` 停。
如果想从另一个 Claude Code 会话里关掉：

```bash
# 找 3000 端口的进程
netstat -ano | findstr :3000
# 杀掉
taskkill /PID <上一步看到的 PID> /F
```

## 下次拉取更新

```bash
cd C:\Users\65660\projects\html-anything
git pull
```

HTTPS 走不通时（防火墙拦截 github.com），用 SSH：

```bash
git remote set-url origin git@github.com:nexu-io/html-anything.git
git pull
```

## 重新装依赖

如果 `node_modules/` 丢了或想重装：

```bash
cd C:\Users\65660\projects\html-anything
pnpm install
```

> 该 sandbox 上 esbuild postinstall 会 EINVAL，pnpm 10 默认跳过（`approve-builds` 机制），
> 不影响 dev 启动。

## 常见问题

### 1. 浏览器看到 "Cross-origin request blocked"
用 **http://localhost:3000** 打开，不要用 Network URL（如 `10.42.181.27:3000`）。

### 2. "生成 HTML" 按钮没反应
大概率 `CLAUDECODE` 没清空。重启 dev server 时必须带 `CLAUDECODE=''` 前缀。

### 3. 端口 3000 被占
```bash
# 找到占 3000 的进程
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
或者用别的端口：`pnpm -F @html-anything/next dev -- -p 3001`

### 4. 卸载/重装 pnpm
```bash
npm install -g pnpm@10.33.2
```
（`package.json` 里 `packageManager: "pnpm@10.33.2"`）

## 项目资料

- README: `README.md`（英文）/ `README.zh-CN.md`（中文）
- AGENTS.md: 项目结构 + 架构
- CLAUDE.md: 给 Claude 的项目说明
- PROGRESS.md: 更新日志
