export interface Lottery {
  id: string;
  round: number;
  active_user_count: number,
  ticket_number_count: number;
  lottery_pool_id: string; //最新一期彩票池id  
}

export interface LotteryPool {
  id: string;
  no: number;
  create_time: number;
  status: number;
  winner_ticket_id: string;
  hold_on_time: number;
  total_amount_pool: number;
  end_date: Date;
}

export interface WinnerTicket {
  digest: string;
  sender: string;
  lottery_pool_id: string;
  lottery_pool_no: string;
  rewards_map: Map<string, number>,
  ticket_no: string;
  ticket_id: string;
  timestamp: string;
}

export function createLottery(data: any): Lottery | null {
  if (!data) return null;
  if (!data.fields) return null;
  let lottery_json = data.fields;
  let active_user_count = 0;
  let ticket_number_count = 0;
  if(lottery_json.user_deposit.size){
    active_user_count = lottery_json.user_deposit.size;
  }else {
    active_user_count = lottery_json.user_deposit.fields.size;
  }
  if(lottery_json.ticket_number_index.size){
    ticket_number_count = lottery_json.ticket_number_index.size;
  }else {
    ticket_number_count = lottery_json.ticket_number_index.fields.size;
  }

  let lottery: Lottery = {
    id: lottery_json.id.id,
    round: lottery_json.round,
    active_user_count: active_user_count,
    ticket_number_count: ticket_number_count,
    lottery_pool_id: lottery_json.lottery_pool_id,
  }
  console.debug("lottery", lottery);
  return lottery;
}


export function createLotteryPool(data: any): LotteryPool | null {
  if (!data) return null;
  if (!data.fields) return null;
  let fields = data.fields;
  let lotteryPool = converToLotteryPool(fields);

  console.debug("lotteryPool", lotteryPool);
  return lotteryPool;
}
export function getWinnerTickets(data: any): Array<WinnerTicket> {
  
  let digest_map: Map<string, WinnerTicket> = new Map();
  let result: Array<WinnerTicket> = new Array();
  //重新组合，因为一个digest可能有多种奖励
  for (let i = 0; i < data.length; i++) {
    let { transactionBlock, timestamp, sender, contents } = data[i];
    let digest = transactionBlock.digest;
    if (digest_map.has(digest)) {
      let ticket: WinnerTicket | undefined = digest_map.get(digest);
      ticket?.rewards_map.set(contents.json.reward_coin_type, parseInt(contents.json.reward));
    } else {
      let ticket: WinnerTicket = {
        digest: transactionBlock.digest,
        sender: sender.address,
        lottery_pool_id: contents.json.lottery_id,
        lottery_pool_no: contents.json.lottery_no,
        rewards_map: new Map(),
        ticket_no: contents.json.ticket_no,
        ticket_id: contents.json.ticket_id,
        timestamp: timestamp,
      }
      ticket.rewards_map.set(contents.json.reward_coin_type, parseInt(contents.json.reward));
      result.push(ticket);
    }
  }
  return result;
}

export function getLotteryPools(allLotteryPool: any): Array<LotteryPool> {
  let result: Array<LotteryPool> = new Array();
  for (let i = 0; i < allLotteryPool.length; i++) {
    let item = allLotteryPool[i];
    let lotteryPool = converToLotteryPool(item);
    result.push(lotteryPool);
  }
  return result;
}


function converToLotteryPool(item: any): LotteryPool {

  let lotteryPool: LotteryPool = {
    id: item.id,
    no: item.no,
    create_time: item.create_time,
    status: item.status,
    winner_ticket_id: item.winner_ticket_id,
    hold_on_time: 0,
    total_amount_pool: 0,
    end_date: new Date(),
  }

  if(!( typeof item.id ==  "string")){
    lotteryPool.id = item.id.id;
  }
  if (item.status) {
    lotteryPool.status = item.status;
  } else {
    lotteryPool.status = 1;
  }
  // 如果hold_on_time存在，则使用hold_on_time，否则使用7天后的时间
  if (item.hold_on_time) {
    lotteryPool.hold_on_time = item.hold_on_time;
  } else {
    lotteryPool.hold_on_time = 7 * 24 * 60 * 60 * 1000;
  }
  let end = parseInt(lotteryPool?.hold_on_time.toString()) + parseInt(lotteryPool?.create_time.toString());
  lotteryPool.end_date = new Date(end);

  if(item.amount_deposit){
    lotteryPool.total_amount_pool = item.amount_deposit / 1_000_000_000;
  }
  return lotteryPool;
}
