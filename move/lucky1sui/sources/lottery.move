module lucky1sui::lottery {
    use sui::object::{Self, UID, ID};
    use sui::{clock::Clock, tx_context::{Self, TxContext}, transfer, vec_map::{Self, VecMap}, coin::{Self, Coin}};
    use std::string::{Self, String};
    use lending_core::account::{AccountCap};
    use lending_core::lending;
    use lending_core::incentive_v2::{Incentive as IncentiveV2};
    use lending_core::incentive_v3::{Self, Incentive};
    use lending_core::pool::{Pool};
    use lending_core::storage::{Storage};
    use lending_core::version;
    use lending_core::logic;
    use oracle::oracle::{PriceOracle};
    use std::type_name;
    use lucky1sui::{lottery_vault, lottery_event, lottery_ticket::{Self, TicketPool}};

    // LotteryAdminCap现在是public的，因为内部结构声明不被支持
    public struct LotteryAdminCap has key, store {
        id: UID
    }
    // 每一期的池
    public struct LotteryPool has key, store {
        id: UID,
        // 名称
        name: String,
        // 期数
        no: u64, 
        create_time:u64,
        is_end: bool,
        user_deposit: VecMap<address, u64>, // 用户已存入的资金
        joined_ticket_numbers: VecMap<String, ID> //彩票号对应彩票nft
    }

    public struct Lottery has key, store {
        id: UID,
        lottery_pool_id: ID, //最新一期彩票池id
        ticket_pool_id: ID,
        asset_index: VecMap<String, u8>,
        account_cap: AccountCap,
        hold_on_time: u64
    }

    /**
    常量定义
    */
    const CAN_NOT_START_LOTTERY:u8 = 11;
    const NOT_SUPPORT_COIN_TYPE:u8 = 12;
    const NOT_SUPPORT_COIN_AMOUNT:u8 = 13;
    const E_NOT_SELECT_TICKET_NO:u8 = 14;
    const E_EMPTY_POOL: u8 = 32;
    const E_NOT_LIVE: u8 = 33;

    fun init(ctx: &mut TxContext) {
        let addr: address = @0x1;
        let admin_cap = LotteryAdminCap {
            id: object::new(ctx)
        };

        let mut asset_index = vec_map::empty();
        asset_index.insert(b"0000000000000000000000000000000000000000000000000000000000000002::sui::SUI".to_string(), 0);

        let lottery = Lottery {
            id: object::new(ctx),
            lottery_pool_id: object::id_from_address(addr),
            account_cap: lending::create_account(ctx),
            asset_index,
            hold_on_time: 7*24*60*60*1000 //开奖时间。后续会用作校验
        };
        transfer::public_share_object(lottery);
        transfer::public_transfer(admin_cap, ctx.sender());
    }


    //创建第一个彩票活动
    public entry fun startFirstLottery(_: LotteryAdminCap, lottery: &mut Lottery, clock : & Clock, ctx: &mut TxContext){
        let ox1_id = object::id_from_address(@0x1);
        //如果彩票活动已经被开始了，则抛出1错误码
        assert!(lottery.lottery_pool_id != ox1_id, CAN_NOT_START_LOTTERY);

        let lottery_pool = LotteryPool{
            id: object::new(ctx),
            name: b"LuckOneSui".to_string(),
            no:1,
            is_end: false,
            create_time: clock.timestamp_ms(),
            user_deposit: vec_map::empty(), // 用户已存入的资金
            joined_ticket_numbers: vec_map::empty(), 
        };
        //创建NFT池子
        let ticket_pool = lottery_ticket::createTicketPool(ctx);
        let ticket_pool_id = object::id(&ticket_pool);
        // 获取 lottery_pool 的 ID
        let lottery_pool_id = object::id(&lottery_pool);

        lottery.lottery_pool_id = lottery_pool_id;
        lottery.ticket_pool_id = ticket_pool_id;
        transfer::public_share_object(ticket_pool);
        transfer::public_share_object(lottery_pool);
    }


    public entry fun joinLotteryPool<CoinType>(
        lottery: &Lottery,
        lotteryPool: &mut LotteryPool, 
        ticketPool: &mut TicketPool,
        depositCoin: Coin<CoinType>, 
        storage: &mut Storage, 
        incentiveV3: &mut Incentive, 
        incentiveV2: &mut IncentiveV2, 
        pool: &mut Pool<CoinType>, 
        clock: &Clock, 
        random: &Random
        ctx: &mut TxContext){
        //目前只支持sui
        let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
        assert!(lottery.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);
        
        //coin 的金额必须是整数且大于1
        let coin_count: u64 = depositCoin.value() / 1000000000;
        let coin_mod = depositCoin.value() % 1000000000;
        assert!(coin_mod == 0, NOT_SUPPORT_COIN_AMOUNT);
        assert!(coin_count > 0, NOT_SUPPORT_COIN_AMOUNT);
        //生成彩票nft 待实现
        let ticket=lottery_ticket::getTicket(ticketPool, lotteryPool.no, random, ctx);
        //生成彩票号码
        lottery_ticket::addTicketNumber(&mut ticket, lotteryPool.no, coin_count, clock, &mut lotteryPool.joined_ticket_numbers);
        // 获取 account_cap 的引用
        //拿到资产索引
        let asset = *lottery.asset_index.get(target_coin_type);
        // 获取 account_cap 的引用
        let account_cap_ref = &lottery.account_cap;
        // 调用 deposit 函数, 存入navi
        lottery_vault::deposit<CoinType>(asset, account_cap_ref, depositCoin, storage, pool, incentiveV2, incentiveV3, clock);
        
        // 更新用户已存入的资金
        lotteryPool.user_deposit.insert(ctx.sender(), depositCoin.value());
        // 将彩票nft转移给用户
        transfer::public_transfer(ticket, ctx.sender());

        //发出事件
        let lottery_id = object::id(lotteryPool);
        lottery_event::emit_user_buy_ticket(lottery_id, lotteryPool.no, ctx.sender(), depositCoin.value());
        lottery_event::emit_generate_ticket(lottery_id, lotteryPool.no, object::id(&ticket), ctx.sender());
    }


    public entry fun exitLotteryPool<CoinType>(
        lottery: &Lottery,
        lotteryPool: &mut LotteryPool, 
        ticket_nums: vector<String>
        storage: &mut Storage,
        pool: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        clock: &Clock,
        oracle: &PriceOracle,
        ctx: &mut TxContext){
        let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
        assert!(lottery.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);
        
        assert!(ticket_nums.length() == 0, E_NOT_SELECT_TICKET_NO);
        //退的金额
        //let amount = ticket_nums.length() * 1000000000;
        //先将彩票号移除待抽奖池

        while(ticket_nums.length() > 0){
            let ticket_no = ticket_nums.pop_back();
            
            lotteryPool.joined_ticket_numbers;
        }

    }
}
