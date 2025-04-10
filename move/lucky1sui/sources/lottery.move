module lucky1sui::lottery {
    use sui::object::{Self, UID, ID};
    use sui::{clock::Clock, random::{Self, Random, RandomGenerator}, tx_context::{Self, TxContext}, transfer, vec_map::{Self, VecMap}, coin::{Self, Coin}};
    use std::string::{Self, String};
    use lending_core::account::{AccountCap};
    use lending_core::lending;
    use lending_core::incentive_v2::{Incentive as IncentiveV2};
    use lending_core::incentive_v3::{Self, Incentive, RewardFund};
    use lending_core::pool::{Pool};
    use lending_core::storage::{Storage};
    use lending_core::version;
    use lending_core::logic;
    use oracle::oracle::{PriceOracle};
    use std::type_name;
    use lucky1sui::{lottery_vault, lottery_event, lottery_ticket::{Self, TicketPool, Ticket}};

    // LotteryAdminCap现在是public的，因为内部结构声明不被支持
    public struct LotteryAdminCap has key, store {
        id: UID
    }
    // 每一期的池
    public struct LotteryPool has key {
        id: UID,
        // 名称
        name: String,
        // 期数
        no: u64, 
        create_time:u64,
        is_end: bool,
        user_deposit: VecMap<address, u64>, // 用户已存入的资金
        joined_ticket_numbers: VecMap<String, ID>, //彩票号对应彩票nft
        ticket_address_map: VecMap<String, address>, //彩票号对应用户地址
    }

    public struct Lottery has key {
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
    const CAN_NOT_START_LOTTERY:u64 = 11;
    const NOT_SUPPORT_COIN_TYPE:u64 = 12;
    const NOT_SUPPORT_COIN_AMOUNT:u64 = 13;
    const E_NOT_SELECT_TICKET_NO:u64 = 14;
    const E_EMPTY_POOL: u64 = 32;
    const E_NOT_LIVE: u64 = 33;
    const E_NOT_ENOUGH_TIME: u64 = 34; //抽奖时间未到
    const E_NOT_ENOUGH_TIME_TO_REFUND: u64 = 35; //开奖前1小时不能退款
    fun init(ctx: &mut TxContext) {
        let addr_0x1: address = @0x1;
        let admin_cap = LotteryAdminCap {
            id: object::new(ctx)
        };



        let mut asset_index = vec_map::empty();
        asset_index.insert(b"0000000000000000000000000000000000000000000000000000000000000002::sui::SUI".to_string(), 0);

        //创建NFT池子
        let ticket_pool = lottery_ticket::createTicketPool(ctx);
        let ticket_pool_id = object::id(&ticket_pool);


        let lottery = Lottery {
            id: object::new(ctx),
            lottery_pool_id: object::id_from_address(addr_0x1),
            ticket_pool_id: ticket_pool_id,
            account_cap: lending::create_account(ctx),
            asset_index,
            hold_on_time: 7*24*60*60*1000, //开奖时间。后续会用作校验
        };
        transfer::share_object(lottery);
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_share_object(ticket_pool);
    }


    //创建第一个彩票活动
    public entry fun startFirstLottery(_: &LotteryAdminCap, lottery: &mut Lottery, clock : & Clock, ctx: &mut TxContext){
        let ox1_id = object::id_from_address(@0x1);
        //如果彩票活动已经被开始了，则抛出1错误码
        assert!(lottery.lottery_pool_id == ox1_id, CAN_NOT_START_LOTTERY);

        let lottery_pool = LotteryPool{
            id: object::new(ctx),
            name: b"LuckOneSui".to_string(),
            no:1,
            is_end: false,
            create_time: clock.timestamp_ms(),
            user_deposit: vec_map::empty(), // 用户已存入的资金
            joined_ticket_numbers: vec_map::empty(), 
            ticket_address_map: vec_map::empty(), //彩票号对应用户地址
        };

        // 获取 lottery_pool 的 ID
        let lottery_pool_id = object::id(&lottery_pool);

        lottery.lottery_pool_id = lottery_pool_id;
        
        transfer::share_object(lottery_pool);
    }

    //参与抽奖
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
        random: &Random,
        ctx: &mut TxContext){
        //目前只支持sui
        let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
        assert!(lottery.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);
        
        //coin 的金额必须是整数且大于1
        let coin_count: u64 = depositCoin.value() / 1000000000;
        assert!(coin_count > 0, NOT_SUPPORT_COIN_AMOUNT);
        let coin_mod = depositCoin.value() % 1000000000;
        assert!(coin_mod == 0, NOT_SUPPORT_COIN_AMOUNT);
        //生成彩票nft
        let mut ticket=lottery_ticket::getTicket(ticketPool, lotteryPool.no, random, ctx);
        //生成彩票号码
        let ticket_id = object::id(&ticket);
        lottery_ticket::addTicketNumber(&mut ticket, lotteryPool.no, coin_count, clock);
        let ticket_number_set = lottery_ticket::getTicketNumberSet(&ticket);
        //将彩票号和彩票nftid关联起来
        let mut i=0;
        while(i < vector::length(ticket_number_set)){
            let ticket_no = vector::borrow(ticket_number_set, i);
            lotteryPool.joined_ticket_numbers.insert(*ticket_no, ticket_id);
            lotteryPool.ticket_address_map.insert(*ticket_no, ctx.sender());
            i=i+1;
        };
        
        // 获取 account_cap 的引用
        //拿到资产索引
        let asset = *lottery.asset_index.get(target_coin_type);
        // 获取 account_cap 的引用
        let account_cap_ref = &lottery.account_cap;
        // 调用 deposit 函数, 存入navi
        let deposit_coin = depositCoin;
        let deposit_coin_value = deposit_coin.value();
        lottery_vault::deposit<CoinType>(asset, account_cap_ref, deposit_coin, storage, pool, incentiveV2, incentiveV3, clock);
        
        // 更新用户已存入的资金
        // 如果用户已经存在，则更新金额，否则插入   
        if(lotteryPool.user_deposit.contains(&ctx.sender())){        
            let old_value = lotteryPool.user_deposit.get(&ctx.sender());
            let total = *old_value + deposit_coin_value;
            lotteryPool.user_deposit.insert(ctx.sender(), total);
        }else{
            lotteryPool.user_deposit.insert(ctx.sender(), deposit_coin_value);
        };

        //发出事件
        let lotteryId = object::id(lotteryPool);
        let ticketId = object::id(&ticket);
        // 将彩票nft转移给用户
        transfer::public_transfer(ticket, ctx.sender());
        lottery_event::emit_user_buy_ticket(lotteryId, lotteryPool.no, ctx.sender(), deposit_coin_value);
        lottery_event::emit_generate_ticket(lotteryId, lotteryPool.no, ticketId, ctx.sender());
    }

    //退出抽奖
    public entry fun exitLotteryPool<CoinType>(
        lottery: &Lottery,
        lotteryPool: &mut LotteryPool, 
        ticket: &mut Ticket,
        storage: &mut Storage,
        pool: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        clock: &Clock,
        oracle: &PriceOracle,
        ctx: &mut TxContext){
        let now = clock.timestamp_ms();
        let lottery_pool_create_time = lotteryPool.create_time;
        let hold_on_time = lottery.hold_on_time;
        //时间限制，开奖前1小时不能退款
        assert!(now >= lottery_pool_create_time + hold_on_time - 1*60*60*1000, E_NOT_ENOUGH_TIME_TO_REFUND); 

        let ticket_id = object::id(ticket);
        let ticket_nums = lottery_ticket::getMutTicketNumberSet(ticket);
        let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
        assert!(lottery.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);
        
        assert!(ticket_nums.length() != 0, E_NOT_SELECT_TICKET_NO);
        //退的金额
        let mut amount = ticket_nums.length() * 1000000000;
        //拿到用户当前已存的金额
        let ticket_amount = lotteryPool.user_deposit.get(&ctx.sender());
        //如果用户当前已存的金额小于退的金额，则退的金额为当前已存的金额
        if(*ticket_amount < amount){
            amount = *ticket_amount;
        };

        //先将彩票号移除待抽奖池
        //从彩票中拿到彩票号
        let mut i = 0;

        while(ticket_nums.length() > 0){
            let ticket_no = ticket_nums.borrow(i);
            //将彩票号移除待抽奖池
            lotteryPool.joined_ticket_numbers.remove(ticket_no);
            //移除彩票号
            ticket_nums.remove(i);
            i=i+1;
        };

        //退款操作
        // 获取 account_cap 的引用
        let account_cap_ref = &lottery.account_cap;
        let asset = *lottery.asset_index.get(target_coin_type);
        lottery_vault::withdraw<CoinType>(asset, account_cap_ref, amount, storage, pool, incentive_v2, incentive_v3, clock, oracle, ctx);
        //发出彩票失效事件
        let lotteryId = object::id(lotteryPool);
        lottery_event::emit_ticket_number_invalid(lotteryId, lotteryPool.no, ticket_id,*ticket_nums, ctx.sender(), amount);
    }

    //开奖
    public entry fun drawLottery<RewardCoinType>(
        clock: &Clock,
        rand: &Random,
        lottery: &mut Lottery,
        lotteryPool: &mut LotteryPool,
        storage: &mut Storage,
        incentive: &mut Incentive,
        reward_fund: &mut RewardFund<RewardCoinType>,
        oracle: &PriceOracle,
        ctx: &mut TxContext){
            //先抽奖
            //判断时间是否到了抽奖时间
            let now = clock.timestamp_ms();
            let lottery_pool_create_time = lotteryPool.create_time;
            let hold_on_time = lottery.hold_on_time;
            assert!(now >= lottery_pool_create_time + hold_on_time, E_NOT_ENOUGH_TIME);
            let mut generator: RandomGenerator = random::new_generator(rand, ctx);
                        //随机抽一个
            let index = random::generate_u64_in_range(&mut generator, 0, lotteryPool.joined_ticket_numbers.size());
            //拿到中奖彩票id和彩票号
            let (ticket_no, ticket_id) = lotteryPool.joined_ticket_numbers.get_entry_by_idx(index);
            //转账给中奖用户 
            let winner_addresss = lotteryPool.ticket_address_map.get(ticket_no);

            //发出事件
            let lotteryId = object::id(lotteryPool);
            lottery_vault::claim_reward_entry<RewardCoinType>(clock, incentive, storage, reward_fund, winner_addresss, &lottery.account_cap, lotteryId, lotteryPool.no, *ticket_id, *ticket_no, ctx);
            //移除中奖彩票
            lotteryPool.joined_ticket_numbers.remove_entry_by_idx(index);
            //销毁当前lotteryPool
            lotteryPool.is_end = true;

            //自动开始新的一期
            let no = lotteryPool.no + 1;
            let new_lottery_pool = LotteryPool{
                id: object::new(ctx),
                name: b"LuckyOneSui".to_string(),
                no:no,
                is_end: false,
                create_time: clock.timestamp_ms(),
                user_deposit: lotteryPool.user_deposit, // 用户已存入的资金
                joined_ticket_numbers: lotteryPool.joined_ticket_numbers, 
                ticket_address_map: lotteryPool.ticket_address_map,
            };

            // 获取 lottery_pool 的 ID
            let new_lottery_pool_id = object::id(&new_lottery_pool);
            lottery.lottery_pool_id = new_lottery_pool_id;
            transfer::share_object(new_lottery_pool);
            let user_count = lotteryPool.user_deposit.size();
            //发出事件
            lottery_event::emit_lottery_start(lotteryId, no, user_count);
        }

}
