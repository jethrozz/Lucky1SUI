module lucky1sui::lottery {
    use sui::object::{Self, UID, ID};
    use sui::{clock::Clock, random::{Self, Random, RandomGenerator}, tx_context::{Self, TxContext}, transfer, vec_map::{Self, VecMap}, coin::{Self, Coin}};
    use sui::table::{Self, Table};
    use sui::linked_table::{Self, LinkedTable};

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
        status: u8, //1 进行中 2 已结束待领奖 3 已领奖
        amount_deposit: u64, // 总存入金额
        winner_ticket_id: ID, //中奖彩票id
        account_cap: AccountCap,
        hold_on_time: u64,
        asset_index: VecMap<String, u8>,
    }
    public struct JoinTicketInfo has store, copy, drop {
        ticket_number: String,
        ticket_id: ID,
        is_in_pool: bool,
    }

    public struct Lottery has key {
        id: UID,
        lottery_pool_id: ID, //最新一期彩票池id  
        round: u64, //当前期数
        ticket_pool_id: ID, //彩票池id
        index_ticket_number: Table<u64, JoinTicketInfo> , //索引对应的彩票号
        ticket_number_index: Table<String, u64>, //彩票号对应的索引
        index: u64, //累计索引，防止index_ticket_number的key重复
        user_deposit: LinkedTable<address, u64> , // 用户已存入的资金
    }

    /**
    常量定义
    */
    const CAN_NOT_START_LOTTERY:u64 = 11;
    const NOT_SUPPORT_COIN_TYPE:u64 = 12;
    const NOT_SUPPORT_COIN_AMOUNT:u64 = 13;
    const E_NOT_SELECT_TICKET_NO:u64 = 14;
    const E_TICKET_NOT_IN_POOL:u64 = 15;

    const E_EMPTY_POOL: u64 = 32;
    const E_NOT_LIVE: u64 = 33;
    const E_NOT_ENOUGH_TIME: u64 = 34; //抽奖时间未到
    const E_NOT_ENOUGH_TIME_TO_REFUND: u64 = 35; //开奖前1小时不能退款
    const E_CLAIM_REWARD_TICKET_ERROR: u64 = 36; //领奖彩票错误(非领奖彩票)
    const E_CLAIM_REWARD_STATUS_ERROR: u64 = 37; //领奖状态错误(非已开奖待领奖)
    const E_LOTTERY_POOL_STATUS_NOT_1: u64 = 38; //领奖状态错误(非已开奖待领奖)

    fun init(ctx: &mut TxContext) {
        let addr_0x1: address = @0x1;
        let admin_cap = LotteryAdminCap {
            id: object::new(ctx)
        };

        let ticket_pool_id = lottery_ticket::createTicketPool(ctx);

        let user_deposit = linked_table::new<address, u64>(ctx);

        let index_ticket_number = table::new<u64, JoinTicketInfo>(ctx);
        let ticket_number_index =  table::new<String, u64>(ctx); //彩票号对应的索引
        let lottery = Lottery {
            id: object::new(ctx),
            lottery_pool_id: object::id_from_address(addr_0x1),
            ticket_pool_id,
            index_ticket_number,
            ticket_number_index,
            user_deposit,
            index: 0,
            round: 1,
        };
        
        transfer::share_object(lottery);
        transfer::public_transfer(admin_cap, ctx.sender());
    }


    //创建第一个彩票活动
    public entry fun startFirstLottery(_: &LotteryAdminCap, lottery: &mut Lottery, clock : & Clock, ctx: &mut TxContext){
        let ox1_id = object::id_from_address(@0x1);
        //如果彩票活动已经被开始了，则抛出1错误码
        assert!(lottery.lottery_pool_id == ox1_id, CAN_NOT_START_LOTTERY);

        let lottery_pool = createLotteryPool(lottery.round,0, ctx, clock);
        let user_count = lottery.user_deposit.length();
        let no = lottery_pool.no;
        // 获取 lottery_pool 的 ID
        let lottery_pool_id = object::id(&lottery_pool);
        lottery.lottery_pool_id = lottery_pool_id;
        transfer::share_object(lottery_pool);
        //发出事件
        lottery_event::emit_lottery_start(lottery_pool_id, no, user_count);
    }

    fun createLotteryPool(round: u64, amount_deposit: u64, ctx: &mut TxContext, clock : &Clock): LotteryPool {
        let mut asset_index = vec_map::empty();
        asset_index.insert(b"0000000000000000000000000000000000000000000000000000000000000002::sui::SUI".to_string(), 0);

        let lottery_pool = LotteryPool{
            id: object::new(ctx),
            name: b"LuckOneSui".to_string(),
            no: round,
            status: 1,
            create_time: clock.timestamp_ms(),
            amount_deposit, // 总存入金额
            winner_ticket_id: object::id_from_address(@0x0),
            account_cap: lending::create_account(ctx),
            asset_index,
            hold_on_time: 7*24*60*60*1000, //开奖时间。后续会用作校验
        };
        lottery_pool    
    }

    //参与抽奖
    public entry fun joinLotteryPool<CoinType>(
        lottery: &mut Lottery,
        lottery_pool: &mut LotteryPool, 
        ticket_pool: &mut TicketPool,
        deposit_coin: Coin<CoinType>, 
        storage: &mut Storage,
        incentive_v3: &mut Incentive, 
        incentive_v2: &mut IncentiveV2, 
        pool: &mut Pool<CoinType>, 
        clock: &Clock, 
        random: &Random,
        ctx: &mut TxContext){
        //目前只支持sui
        //判断状态是否为进行中
        assert!(lottery_pool.status == 1, E_LOTTERY_POOL_STATUS_NOT_1);
        let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
        assert!(lottery_pool.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);
        
        //coin 的金额必须是整数且大于1且小于等于10
        let coin_count: u64 = deposit_coin.value() / 1000000000;
        assert!(coin_count > 0, NOT_SUPPORT_COIN_AMOUNT);
        assert!(coin_count <= 10, NOT_SUPPORT_COIN_AMOUNT);
        let coin_mod = deposit_coin.value() % 1000000000;
        assert!(coin_mod == 0, NOT_SUPPORT_COIN_AMOUNT);
        //生成彩票nft
        let mut ticket=lottery_ticket::getTicket(ticket_pool, lottery_pool.no, random, ctx);
        //生成彩票号码
        let ticket_id = object::id(&ticket);
        lottery_ticket::addTicketNumber(&mut ticket, lottery_pool.no, coin_count, clock);
        let ticket_number_set = lottery_ticket::getTicketNumberSet(&ticket);
        //将彩票号和彩票nftid关联起来
        let mut i=0;

        let mut cur_length = lottery.index;

        while(i < vector::length(ticket_number_set)){
            let ticket_no = vector::borrow(ticket_number_set, i);
            let joinTicketInfo = JoinTicketInfo{
                ticket_number: *ticket_no,
                ticket_id,
                is_in_pool: true,
            };
            lottery.index_ticket_number.add(cur_length, joinTicketInfo);
            lottery.ticket_number_index.add(*ticket_no, cur_length);
            cur_length = cur_length + 1;
            i=i+1;
        };
        lottery.index = cur_length;
        // 获取 account_cap 的引用
        //拿到资产索引
        let asset = *lottery_pool.asset_index.get(target_coin_type);
        // 获取 account_cap 的引用
        let account_cap_ref = &lottery_pool.account_cap;
        // 调用 deposit 函数, 存入navi
        let deposit_coin_value = deposit_coin.value();
        lottery_vault::deposit<CoinType>(asset, account_cap_ref, deposit_coin, storage, pool, incentive_v2, incentive_v3, clock);
        
        // 更新用户已存入的资金
        // 如果用户已经存在，则更新金额，否则插入   
        if(lottery.user_deposit.contains(ctx.sender())){        
            let old_value = lottery.user_deposit.borrow(ctx.sender());
            let total = *old_value + deposit_coin_value;
            lottery.user_deposit.remove(ctx.sender());
            lottery.user_deposit.push_back(ctx.sender(), total);
        }else{
            lottery.user_deposit.push_back(ctx.sender(), deposit_coin_value);
        };
        lottery_pool.amount_deposit = lottery_pool.amount_deposit + deposit_coin_value;

        //发出事件
        let lotteryId = object::id(lottery_pool);
        let ticketId = object::id(&ticket);
        // 将彩票nft转移给用户
        transfer::public_transfer(ticket, ctx.sender());
        lottery_event::emit_generate_ticket(lotteryId, lottery_pool.no, ticketId, ctx.sender());
        lottery_event::emit_user_buy_ticket(lotteryId, lottery_pool.no, ctx.sender(), deposit_coin_value);
    }

    //退出抽奖
    public entry fun exitLotteryPool<CoinType>(
        lottery: &mut Lottery,
        lottery_pool: &mut LotteryPool, 
        ticket: &mut Ticket,
        storage: &mut Storage,
        pool: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        clock: &Clock,
        oracle: &PriceOracle,
        ctx: &mut TxContext){
        //如果彩票已经是无效的则直接返回error
        assert!(lottery_ticket::ticket_is_in_pool(ticket), E_TICKET_NOT_IN_POOL);
        //判断状态是否为进行中
        assert!(lottery_pool.status == 1, E_LOTTERY_POOL_STATUS_NOT_1);
        let now = clock.timestamp_ms();
        let lottery_pool_create_time = lottery_pool.create_time;
        let hold_on_time = lottery_pool.hold_on_time;
        //时间限制，开奖前1小时不能退款
        assert!(now < lottery_pool_create_time + hold_on_time - 1*60*60*1000, E_NOT_ENOUGH_TIME_TO_REFUND); 

        let ticket_id = object::id(ticket);

        let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
        assert!(lottery_pool.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);
        
        lottery_ticket::removeTicket(ticket);
        let ticket_nums = lottery_ticket::getMutTicketNumberSet(ticket);
        
        //退的金额
        let mut amount = ticket_nums.length() * 1_000_000_000;
        //拿到用户当前已存的金额
        let ticket_amount = lottery.user_deposit.borrow(ctx.sender());
        let mut left_amount = 0;
        //如果用户当前已存的金额小于退的金额，则退的金额为当前已存的金额
        if(*ticket_amount < amount){
            amount = *ticket_amount;
            left_amount = 0;
        }else{
            left_amount = *ticket_amount - amount;
        };
        lottery_pool.amount_deposit = lottery_pool.amount_deposit - amount;
        //先将彩票号移除待抽奖池
        //从彩票中拿到彩票号

        let mut i = 0;
        while(i < ticket_nums.length()){
            //将彩票号从彩票中移除
            let ticket_no = ticket_nums.borrow(i);
            if(lottery.ticket_number_index.contains(*ticket_no)){
                //先去池子拿到索引，
                let index = lottery.ticket_number_index.remove(*ticket_no);
                //将彩票号移除待抽奖池
                let _joinTicketInfo = lottery.index_ticket_number.remove(index);
            };
            i=i+1;
        };

        //更新用户已存入的资金
        lottery.user_deposit.remove(ctx.sender());
        if(left_amount > 0){
            lottery.user_deposit.push_back(ctx.sender(), left_amount);
        };

        //退款操作
        // 获取 account_cap 的引用
        let account_cap_ref = &lottery_pool.account_cap;
        let asset = *lottery_pool.asset_index.get(target_coin_type);
        let coin = lottery_vault::withdraw<CoinType>(asset, account_cap_ref, amount, storage, pool, incentive_v2, incentive_v3, clock, oracle, ctx);
        // 将 coin 转移给 ctx.sender()
        transfer::public_transfer(coin, ctx.sender());

        //发出彩票失效事件
        let lotteryId = object::id(lottery_pool);
        lottery_event::emit_ticket_number_invalid(lotteryId, lottery_pool.no, ticket_id,*ticket_nums, ctx.sender(), amount);
    }

    //开奖
    public entry fun drawLottery<RewardCoinType, CoinType>(
        clock: &Clock,
        rand: &Random,
        lottery: &mut Lottery,
        lottery_pool: &mut LotteryPool,
        storage: &mut Storage,
        pool: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        oracle: &PriceOracle,
        ctx: &mut TxContext){

            //判断状态是否为进行中
            assert!(lottery_pool.status == 1, E_LOTTERY_POOL_STATUS_NOT_1);
            //先抽奖
            //判断时间是否到了抽奖时间
            let now = clock.timestamp_ms();
            let lottery_pool_create_time = lottery_pool.create_time;
            let hold_on_time = lottery_pool.hold_on_time;
            assert!(now >= lottery_pool_create_time + hold_on_time, E_NOT_ENOUGH_TIME);
            let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
            assert!(lottery_pool.asset_index.contains(target_coin_type), NOT_SUPPORT_COIN_TYPE);

            let mut generator: RandomGenerator = random::new_generator(rand, ctx);
                        //随机抽一个
            let mut index = random::generate_u64_in_range(&mut generator, 0, lottery.ticket_number_index.length() - 1);
            
            while(!lottery.index_ticket_number.contains(index)){
                index = random::generate_u64_in_range(&mut generator, 0, lottery.ticket_number_index.length() - 1);
            };
            
            //拿到中奖彩票id和彩票号
            let ticket_info = lottery.index_ticket_number.borrow(index);
            lottery_pool.winner_ticket_id = ticket_info.ticket_id;
            //发出事件
            let lotteryId = object::id(lottery_pool);
                        //赋值状态为已开奖待领奖
            lottery_pool.status = 2;
            lottery_vault::get_reward_claimable_rewards<RewardCoinType>(clock, incentive_v3, storage, &lottery_pool.account_cap, lotteryId, lottery_pool.no, ticket_info.ticket_id, ticket_info.ticket_number, ctx);

            let amount = lottery_pool.amount_deposit;
            //拿到coin创建一个新的account_cap 用于下一期
            let asset = *lottery_pool.asset_index.get(target_coin_type);
            let deposit_coin = lottery_vault::withdraw<CoinType>(asset, &lottery_pool.account_cap, amount, storage, pool, incentive_v2, incentive_v3, clock, oracle, ctx);

            //自动开始新的一期
            lottery.round = lottery.round + 1;
            let mut new_lottery_pool = createLotteryPool(lottery.round,amount, ctx, clock);
            lottery_vault::deposit<CoinType>(asset, &new_lottery_pool.account_cap, deposit_coin, storage, pool, incentive_v2, incentive_v3, clock);
            // 获取 lottery_pool 的 ID
            let new_lottery_pool_id = object::id(&new_lottery_pool);
            lottery.lottery_pool_id = new_lottery_pool_id;
            let user_count = lottery.user_deposit.length();
            transfer::share_object(new_lottery_pool);
            //发出事件
            lottery_event::emit_lottery_start(new_lottery_pool_id, lottery.round, user_count);
        }

    public entry fun claim_reward<RewardCoinType>(
        clock: &Clock,
        incentive: &mut Incentive,
        storage: &mut Storage,
        ticket: &Ticket,
        reward_fund: &mut RewardFund<RewardCoinType>,
        lottery_pool: &mut LotteryPool,
        ctx: &mut TxContext){
        //如果彩票已经是无效的则直接返回error
        assert!(lottery_ticket::ticket_is_in_pool(ticket), E_TICKET_NOT_IN_POOL);
                //判断中奖彩票是否存在
        let ticket_id = object::id(ticket);
        assert!(lottery_pool.winner_ticket_id == ticket_id, E_CLAIM_REWARD_TICKET_ERROR);
        //判断状态是否为已开奖待领奖
        assert!(lottery_pool.status == 2, E_CLAIM_REWARD_STATUS_ERROR);
        //赋值状态为已领奖
        lottery_pool.status = 3;
        //获取奖励
        lottery_vault::claim_reward_entry<RewardCoinType>(clock, incentive, storage, reward_fund, &ctx.sender(), &lottery_pool.account_cap, ctx);
    }

    public entry fun stopLottery<CoinType>(_: &LotteryAdminCap, lottery: &mut Lottery, lottery_pool: &mut LotteryPool,        storage: &mut Storage,
        pool: &mut Pool<CoinType>,
        incentive_v2: &mut IncentiveV2,
        incentive_v3: &mut Incentive,
        oracle: &PriceOracle,clock: &Clock, ctx: &mut TxContext){
            let target_coin_type = &type_name::into_string(type_name::get<CoinType>()).to_string();
            let asset = *lottery_pool.asset_index.get(target_coin_type);
            
            let ( addr, value ) = lottery.user_deposit.pop_front();
            let deposit_coin = lottery_vault::withdraw<CoinType>(asset, &lottery_pool.account_cap, value, storage, pool, incentive_v2, incentive_v3, clock, oracle, ctx);
            transfer::public_transfer(deposit_coin, addr);

            //将用户已存入的资金转移到新的用户已存入的资金
            while(lottery.user_deposit.length() > 0){
                let ( addr, value) = lottery.user_deposit.pop_front();
                let deposit_coin = lottery_vault::withdraw<CoinType>(asset, &lottery_pool.account_cap, value, storage, pool, incentive_v2, incentive_v3, clock, oracle, ctx);
                transfer::public_transfer(deposit_coin, addr);
            };
            lottery_pool.status = 4;
            let ox1_id = object::id_from_address(@0x1);
            lottery.lottery_pool_id = ox1_id;
            lottery.round = lottery.round + 1;
    }
}
