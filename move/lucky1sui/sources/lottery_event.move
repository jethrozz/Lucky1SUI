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
        ticket_no: String, //彩票号
        user: address, //用户
    }

    // 用户中奖
    public struct UserWinTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user: address, //中奖用户
        reward: u64, //奖金
        coin_type: String, //币种
        ticket_no: String, //彩票号
        ticket_id: ID //彩票nft id
    }

    //彩票活动开始
    public struct LotteryStart has copy, drop {
        lottery_pool_id: ID, //id
        lottery_pool_no: u64, //期数
        user_count: u64, //参与用户数
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
        ticket_no: String,
        user: address
    ) {
        event::emit(InvalidTicketNumber {
            lottery_id,
            lottery_no,
            ticket_id,
            ticket_no,
            user
        });
    }

    public(package) fun emit_user_win_ticket(
        lottery_id: ID,
        lottery_no: u64,
        user: address,
        reward: u64,
        coin_type: String,
        ticket_no: String,
        ticket_id: ID
    ) {
        event::emit(UserWinTicket {
            lottery_id,
            lottery_no,
            user,
            reward,
            coin_type,
            ticket_no,
            ticket_id
        });
    }

    public(package) fun emit_lottery_start(
        lottery_pool_id: ID,
        lottery_pool_no: u64,
        user_count: u64
    ) {
        event::emit(LotteryStart {
            lottery_pool_id,
            lottery_pool_no,
            user_count
        });
    }
}