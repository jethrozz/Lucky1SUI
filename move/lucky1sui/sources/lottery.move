module lucky1sui::lottery {
    use sui::object::{Self, UID, ID};
    use sui::{clock::Clock, random::{Self, Random, RandomGenerator}, tx_context::{Self, TxContext}, transfer, vec_map::{Self, VecMap}, coin::{Self, Coin}, vec_set::{Self, VecSet}};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
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
        amt: Balance<SUI>,
    }

    public struct Lottery has key {
        id: UID,
        lottery_pool_id: ID, //最新一期彩票池id
        ticket_pool_id: ID,
        asset_index: VecMap<String, u8>,
        //已经中奖的彩票ID
        winner_ticket_id: VecSet<ID>,
        account_cap: AccountCap,
        hold_on_time: u64,
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
            winner_ticket_id: vec_set::empty(),
            hold_on_time: 1*24*60*60*1000, //开奖时间。后续会用作校验

        };
        transfer::share_object(lottery);
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_share_object(ticket_pool);
    }


    //创建第一个彩票活动
    public entry fun startFirstLottery(_: &LotteryAdminCap, lottery: &mut Lottery, clock : & Clock, ctx: &mut TxContext){
        let ox1_id = object::id_from_address(@0x1);
        //如果彩票活动已经被开始了，则抛出1错误码
        assert!(lottery.lottery_pool_id != ox1_id, CAN_NOT_START_LOTTERY);

        let lottery_pool = LotteryPool{
            id: object::new(ctx),
            name: b"LuckyOneSui".to_string(),
            no:1,
            is_end: false,
            create_time: clock.timestamp_ms(),
            user_deposit: vec_map::empty(), // 用户已存入的资金
            joined_ticket_numbers: vec_map::empty(), 
            amt: balance::zero(),
            ticket_address_map: vec_map::empty(),
        };

        // 获取 lottery_pool 的 ID
        let lottery_pool_id = object::id(&lottery_pool);

        lottery.lottery_pool_id = lottery_pool_id;
        
        transfer::share_object(lottery_pool);
    }

    //参与抽奖
    public entry fun joinLotteryPool(
        lottery: &Lottery,
        lotteryPool: &mut LotteryPool, 
        ticketPool: &mut TicketPool,
        depositCoin: Coin<SUI>, 
        storage: &mut Storage, 
        incentiveV3: &mut Incentive, 
        incentiveV2: &mut IncentiveV2, 
        pool: &mut Pool<SUI>, 
        clock: &Clock, 
        random: &Random,
        ctx: &mut TxContext){
                
        //目前只支持sui
        let target_coin_type = &type_name::into_string(type_name::get<SUI>()).to_string();
        assert!(lottery.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);
        
        //coin 的金额必须是整数且大于1
        let coin_count: u64 = depositCoin.value() / 1000000000;
        let coin_mod = depositCoin.value() % 1000000000;
        assert!(coin_mod == 0, NOT_SUPPORT_COIN_AMOUNT);
        assert!(coin_count > 0, NOT_SUPPORT_COIN_AMOUNT);
        //生成彩票nft 待实现
        let mut ticket=lottery_ticket::getTicket(ticketPool, lotteryPool.no, random, ctx);
        //生成彩票号码
        let ticket_id = object::id(&ticket);
        let ticket_number_set = lottery_ticket::getMutTicketNumberSet(&mut ticket);
        lottery_ticket::addTicketNumber(ticket_number_set, ticket_id, lotteryPool.no, coin_count, clock, &mut lotteryPool.joined_ticket_numbers);
        
        let mut i=0;
        while(i < ticket_number_set.length()   ){
            let ticket_no = ticket_number_set.borrow(i);
            lotteryPool.ticket_address_map.insert(*ticket_no, ctx.sender());
            i=i+1;
        };

        
        // 获取 account_cap 的引用
        //拿到资产索引
        //let asset = *lottery.asset_index.get(target_coin_type);
        // 获取 account_cap 的引用
        //let account_cap_ref = &lottery.account_cap;
        // 调用 deposit 函数, 存入navi
        let deposit_coin = depositCoin;
        let deposit_coin_value = deposit_coin.value();
        //lottery_vault::deposit<CoinType>(asset, account_cap_ref, deposit_coin, storage, pool, incentiveV2, incentiveV3, clock);
        
        // 更新用户已存入的资金
        // 如果用户已经存在，则更新金额，否则插入   
        if(lotteryPool.user_deposit.contains(&ctx.sender())){        
            let old_value = lotteryPool.user_deposit.get(&ctx.sender());
            let total = *old_value + deposit_coin_value;
            lotteryPool.user_deposit.insert(ctx.sender(), total);
        }else{
            lotteryPool.user_deposit.insert(ctx.sender(), deposit_coin_value);
        };

        // 将金额加入到池子中
        let balance  = coin::into_balance(deposit_coin);
        lotteryPool.amt.join(balance);
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
        let ticket_id = object::id(ticket);
        let ticket_nums = lottery_ticket::getMutTicketNumberSet(ticket);
        let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
        assert!(lottery.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);
        
        assert!(ticket_nums.length() == 0, E_NOT_SELECT_TICKET_NO);
        //退的金额
        let amount = ticket_nums.length() * 1000000000;
        //先将彩票号移除待抽奖池
        //从彩票中拿到彩票号
        let mut i = 0;
        while(ticket_nums.length() > 0){
            let ticket_no = ticket_nums.pop_back();
            //将彩票号移除待抽奖池
            lotteryPool.joined_ticket_numbers.remove(&ticket_no);
            //发出彩票失效事件
            let lotteryId = object::id(lotteryPool);
            //移除彩票号
            ticket_nums.remove(i);
            lottery_event::emit_ticket_number_invalid(lotteryId, lotteryPool.no, ticket_id,ticket_no, ctx.sender());
            i=i+1;
        };

        //退款操作
        let balance = lotteryPool.amt.split(amount);
        let out_coin = coin::from_balance(balance, ctx);
        transfer::public_transfer(out_coin, ctx.sender());
        // 获取 account_cap 的引用
        //let account_cap_ref = &lottery.account_cap;
        //let asset = *lottery.asset_index.get(target_coin_type);
        //lottery_vault::withdraw<CoinType>(asset, account_cap_ref, amount, storage, pool, incentive_v2, incentive_v3, clock, oracle, ctx);
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
            //转账给中奖用户 测试代码只转1个sui
            let amount = lotteryPool.amt.split(1000000000);
            let amount_value = amount.value();
            let out_coin = coin::from_balance(amount, ctx);
            let user_address = lotteryPool.ticket_address_map.get(ticket_no);
            transfer::public_transfer(out_coin, *user_address);
  
            //发出事件
            let lotteryId = object::id(lotteryPool);
            lottery_event::emit_user_win_ticket(lotteryId, lotteryPool.no, *user_address, amount_value);
            //移除中奖彩票
            lotteryPool.joined_ticket_numbers.remove_entry_by_idx(index);
            //销毁当前lotteryPool
            lotteryPool.is_end = true;

            //自动开始新的一期
            let no = lotteryPool.no + 1;
            let lottery_pool = LotteryPool{
                id: object::new(ctx),
                name: b"LuckyOneSui".to_string(),
                no:no,
                is_end: false,
                create_time: clock.timestamp_ms(),
                user_deposit: lotteryPool.user_deposit, // 用户已存入的资金
                joined_ticket_numbers: lotteryPool.joined_ticket_numbers, 
                amt: balance::zero(),
                ticket_address_map: lotteryPool.ticket_address_map,
            };

            // 获取 lottery_pool 的 ID
            let lottery_pool_id = object::id(&lottery_pool);
            lottery.lottery_pool_id = lottery_pool_id;
            transfer::share_object(lottery_pool);
        }
    
}
