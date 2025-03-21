module lucky1sui::lottery {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::vec_map::{Self, VecMap};
    use lending_core::account::{AccountCap};
    use lending_core::lending;
    use lending_core::incentive_v2::{Incentive as IncentiveV1};
    use lending_core::incentive_v3::{Self, Incentive};
    use lending_core::pool::{Pool};
    use lending_core::storage::{Storage};
    use lending_core::version;
    use lending_core::logic;
    use oracle::oracle::{PriceOracle};

    // 每一期的池

    public struct LotteryPool has key, store {
        id: UID,
        // 名称
        name: String,
        // 期数
        no: u64,  //yyyyMMddHHmm
        user_deposit: VecMap<address, u64>, // 用户已存入的资金
        tickets: vector<ID>, // 这一期参与的彩票nft
        user_tickets: VecMap<address, vector<ID>>, // 用户持有的彩票nft
    }

    public struct Lottery has key, store {
        id: UID,
        lottery_pool_id: ID, //最新一期彩票池id
        sui_index: u8,
        account_cap: AccountCap,
        hold_on_time: u64
    }

    fun init(ctx: &mut TxContext) {
        let addr: address = @0x0;
        let lottery = Lottery {
            id: object::new(ctx),
            lottery_pool_id: object::id_from_address(addr),
            account_cap: lending::create_account(ctx),
            sui_index: 0,
            hold_on_time: 7*24*60*60*1000 
        };
        transfer::public_share_object(lottery);
    }

}
