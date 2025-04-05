module lucky1sui::lottery_event {
    use sui::object::{Self, ID};
    use sui::event;
    use std::string::String;
    //事件定义
    // 用户购买彩票
    public struct UserBuyTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user: address, //购买用户
        amount: u64 //购买金额
    }

    //生成彩票
    public struct GenerateTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        ticket_id: ID, //彩票nft id
        user: address, //用户
    }

    //彩票号码失效事件
    public struct InvalidTicketNumber has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        ticket_id: ID, //彩票nft id
        ticket_nos: vector<String>, //彩票号
        user: address, //用户
        refund_amount: u64, //退款金额
    }



    // 用户中奖
    public struct UserWinTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user: address, //中奖用户
        reward: u256, //奖金
        reward_coin_type: std::ascii::String, //奖金类型
        ticket_id: ID, //彩票nft id
        ticket_no: String, //彩票号
    }

    //彩票活动开始
    public struct LotteryStart has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user_count: u64, //参与用户数
    }

    // 用户可领取奖励
    public struct RewardClaimable has copy, drop {
        asset_coin_type: std::ascii::String,
        reward_coin_type: std::ascii::String,
        user_claimable_reward: u256,
        user_claimed_reward: u256
    }


    public(package) fun emit_user_buy_ticket(
        lottery_id: ID,
        lottery_no: u64,
        user: address,
        amount: u64
    ) {
        event::emit(UserBuyTicket {
            lottery_id,
            lottery_no,
            user,
            amount
        });
    }

    public(package) fun emit_generate_ticket(
        lottery_id: ID,
        lottery_no: u64,
        ticket_id: ID,
        user: address
    ) {
        event::emit(GenerateTicket {
            lottery_id,
            lottery_no,
            ticket_id,
            user
        });
    }

    public(package) fun emit_ticket_number_invalid(
        lottery_id: ID,
        lottery_no: u64,
        ticket_id: ID,
        ticket_nos: vector<String>,
        user: address,
        refund_amount: u64
    ) {
        event::emit(InvalidTicketNumber {
            lottery_id,
            lottery_no,
            ticket_id,
            ticket_nos,
            user,
            refund_amount
        });
    }

    public(package) fun emit_reward_claimable(
        asset_coin_type: std::ascii::String,
        reward_coin_type: std::ascii::String,
        user_claimable_reward: u256,
        user_claimed_reward: u256
    ) {
        event::emit(RewardClaimable {
            asset_coin_type,
            reward_coin_type,
            user_claimable_reward,
            user_claimed_reward
        });
    }

    public(package) fun emit_user_win_ticket(
        lottery_id: ID,
        lottery_no: u64,
        user: address,
        reward: u256,
        reward_coin_type: std::ascii::String,
        ticket_id: ID,
        ticket_no: String
    ) {
        event::emit(UserWinTicket {
            lottery_id,
            lottery_no,
            user,
            reward,
            reward_coin_type,
            ticket_id,
            ticket_no
        });
    }

    public(package) fun emit_lottery_start(
        lottery_id: ID,
        lottery_no: u64,
        user_count: u64
    ) {
        event::emit(LotteryStart {
            lottery_id,
            lottery_no,
            user_count
        });
    }
    
}