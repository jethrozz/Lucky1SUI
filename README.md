# lucky1SUI
基于sui的一个彩票项目

## 项目结构描述

```
lucky1SUI/
├── move/                  # Move智能合约目录
│   ├── lucky_capy         # 彩票项目合约
│       ├──source/         # 合约源码
│       ├──tests/          # 单元测试目录
│       └── Move.toml      # 合约工程配置
├── src/                   # 前端源代码目录
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 应用入口文件
│   ├── constants.ts       # 常量定义
│   └── networkConfig.ts   # 网络配置
├── index.html             # HTML入口文件
├── package.json           # 项目依赖配置
├── tsconfig.json          # TypeScript配置
├── vite.config.mts        # Vite构建配置
└── README.md              # 项目说明文档
```

技术栈：
- 前端框架：React + TypeScript
- 构建工具：Vite
- UI组件：Radix UI
- 区块链交互：@mysten/dapp-kit
- 包管理器：pnpm
- 智能合约：Move语言

## 合约设计


## 前端运行

To install dependencies you can run

```bash
pnpm install
```

To start your dApp in development mode run

```bash
pnpm dev
```

## Building

To build your app for deployment you can run

```bash
pnpm build
```
