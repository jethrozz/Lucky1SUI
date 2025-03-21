# lucky1SUI
基于sui的一个彩票项目

## 项目结构描述

```
lucky1SUI/
├── move/                  # Move智能合约目录
│   ├── lucky1sui         # 彩票项目合约
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
### 对象设计
- Lottery对象：由系统初始化，保存最新一期的抽奖池id和AccountCap。
- LotteryPool对象：抽奖池，第一期手动初始化，后续每期在上一期结束后自动生成。保存参与用户的信息和奖券信息
- Ticket对象：彩票奖券，当有一个用户购买时，和SUI cion 1比1，1张彩票最多10个号码。中奖是和彩票号码对应。一个号码1次机会
### 函数设计
#### 启动第一期抽奖
fun startFirstLottery(cap, clock, lottery);
启动第一期抽奖。只有管理员才有权限开启

#### 用户参与抽奖
fun joinLotteryPool(lottery: & Lottery,lotteryPool: &mut LotteryPool, suiCoin: Coin<sui>, storgae: Storage, incentive_v1:Incentive, Incentive_v2:IncentiveV2, pool: Pool, clock: Clock, ctx: &mut TxContext)

#### 用户提取资金
fun exitLotteryPool(lottery: & Lottery,lotteryPool: &mut LotteryPool, amount: u64, storgae: Storage, incentive_v1:Incentive, Incentive_v2:IncentiveV2, pool: Pool,clock: Clock ctx: &mut TxContext)
//amount必须是整数，如1000000000

#### 开奖
fun drawLottery(clock: Clock, random: Random, lottery: & Lottery, lotteryPool: &mut LotteryPool, ctx: &mut TxContext )

#### 生成新一期抽奖
私有函数

### 事件设计
#### 用户购买彩票事件
```rust
    // 用户购买彩票
    public struct UserBuyTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user: address, //购买用户
        amount: u64 //购买金额
    }
```
#### 生成彩票事件
```rust
    //生成彩票
    public struct GenerateTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        ticket_id: ID, //彩票nft id
        user: address, //用户
    }
```
#### 彩票无效事件
一张彩票的所有号码失效
```rust
    //生成彩票
    public struct InvalidTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        ticket_id: ID, //彩票nft id
        user: address, //用户
    }
```

#### 彩票号码失效事件
一张彩票的其中一个号码失效
```rust
    //生成彩票
    public struct InvalidTicketNumber has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        ticket_id: ID, //彩票nft id
        user: address, //用户
    }
```

#### 用户中奖事件
```rust
    public struct UserWinTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user: address, //中奖用户
        reward: u64, //奖金
    }
```

#### 彩票活动开始事件
```rust
    //彩票活动开始
    public struct LotteryStart has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user_count: u64, //参与用户数
    }
```

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
