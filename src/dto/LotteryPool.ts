export interface LotteryPool {
  id: string;
  no: number;
  create_time: number;
  status: number;
  user_deposit: Map<string, number>,
  winner_ticket_id: string;
  hold_on_time: number;
  ticket_sets: Set<string>;
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

export function createLotteryPool(data: any): LotteryPool | null {
  if (!data) return null;
  if (!data.fields) return null;
  let fields = data.fields;
  let lotteryPool = converToLotteryPool(fields);
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
      ticket?.rewards_map.set(contents.json.coin_type, parseInt(contents.json.reward));
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
      ticket.rewards_map.set(contents.json.coin_type, parseInt(contents.json.reward));
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
    user_deposit: new Map(),
    winner_ticket_id: item.winner_ticket_id,
    hold_on_time: 0,
    ticket_sets: new Set(),
    total_amount_pool: 0,
    end_date: new Date(),
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


  let user_deposit = lotteryPool.user_deposit;
  let total_amount_pool = 0;
  let list = [];
  if(item.user_deposit.fields){
    list = item.user_deposit.fields.contents;
  }else{
    list = item.user_deposit.contents;
  }
  for (let i = 0; i < list.length; i++) {
    let fields = {key:"",value:"0"};
    if(list[i].fields){
      fields = list[i].fields;
    }else {
      fields = list[i];
    }
    let { key, value } = fields;
    let value_number = (parseInt(value) as number)
    user_deposit.set(key, value_number);
    total_amount_pool += value_number;
  }

  let joined_ticket_array = [];
  if(item.joined_ticket_numbers.contents){
    joined_ticket_array = item.joined_ticket_numbers.contents
  }else{
    joined_ticket_array = item.joined_ticket_numbers.fields.contents

  }
  for (let i = 0; i < joined_ticket_array.length; i++) {
    let value = null;
    if(joined_ticket_array[i].fields){
      value = joined_ticket_array[i].fields.value;
    }else {
      value = joined_ticket_array[i].value;
    }
    lotteryPool.ticket_sets.add(value)
  }
  lotteryPool.total_amount_pool = total_amount_pool / 1_000_000_000;
  return lotteryPool;
}
