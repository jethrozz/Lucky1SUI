module lucky1sui::lottery_event {
    use sui::object::{Self, ID};
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

    // 用户中奖
    public struct UserWinTicket has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user: address, //中奖用户
        reward: u64, //奖金
    }

    //彩票活动开始
    public struct LotteryStart has copy, drop {
        lottery_id: ID, //id
        lottery_no: u64, //期数
        user_count: u64, //参与用户数
    }
}