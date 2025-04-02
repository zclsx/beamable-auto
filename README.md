# Beamable 自动化工具

这是一个针对 Beamable Network 平台的自动化工具，可以帮助用户自动完成平台上的各种任务，包括每日签到和完成"Retweet, Like & Comment"任务。

## 特性

- ✅ **自动任务处理**：自动模拟点击和完成各种"Retweet, Like & Comment"任务，每个任务可获得500积分
- ✅ **每日签到**：自动执行平台上的每日签到流程
- ✅ **多账户支持**：从`cookies.txt`文件读取多个账户的Cookie信息，并依次处理
- ✅ **代理支持**：从`proxies.txt`文件读取代理信息，为每个账户分配不同的代理，并自动测试连接速度
- ✅ **持续运行**：设计为持续运行，每24小时执行一次任务，也可选择仅执行每日签到
- ✅ **错误处理**：每个请求都有错误处理，确保单个任务失败不会影响其他任务的执行
- ✅ **动态任务更新**：通过GitHub Gist检查新任务，并自动执行

## 安装

1. 确保已安装 [Node.js](https://nodejs.org/) (v14.0.0 或更高版本)
2. 克隆本仓库或下载源代码
3. 在项目目录中运行以下命令安装依赖：

```bash
npm install
```

## 配置

1. 在项目根目录创建 `cookies.txt` 文件，每行一个Cookie字符串
2. 如需使用代理，创建 `proxies.txt` 文件，每行一个代理地址（格式：`http://user:pass@host:port` 或 `http://host:port`）

## 使用方法

### 完整模式（执行所有任务）

```bash
npm start
```

### 仅执行每日签到

```bash
npm run daily
```

### 执行一次后退出（不循环）

```bash
npm run once
```

### 命令行参数

- `--daily-only`: 仅执行每日签到
- `--no-proxy-test`: 跳过代理测试
- `--no-loop`: 执行一次后退出，不循环

## 项目结构

```
beamable-bot/
├── src/
│   ├── api/
│   │   └── beamableApi.js     # API请求模块
│   ├── config/
│   │   ├── constants.js       # 常量配置
│   │   └── questData.js       # 预定义任务数据
│   ├── modules/
│   │   ├── accountManager.js  # 账户管理模块
│   │   └── taskManager.js     # 任务管理模块
│   ├── utils/
│   │   ├── helpers.js         # 工具函数
│   │   └── logger.js          # 日志模块
│   └── index.js              # 主程序入口
├── cookies.txt                # 存放Cookie信息
├── proxies.txt                # 存放代理信息（可选）
├── package.json
└── README.md
```

## 注意事项

- 本工具仅供学习和研究使用
- 过度使用自动化工具可能导致账户被限制或封禁
