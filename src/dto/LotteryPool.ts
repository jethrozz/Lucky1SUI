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

export function createLotteryPool(data: any): LotteryPool | null {
   if(!data) return null;
   if(!data.fields) return null;
   let fields = data.fields;
   let lotteryPool: LotteryPool = {
    id: fields.id.id,
    no: fields.no,
    create_time: fields.create_time,
    status: fields.status,
    user_deposit: new Map(),
    winner_ticket_id: fields.winner_ticket_id,
    hold_on_time: 0,
    ticket_sets: new Set(),
    total_amount_pool: 0,
    end_date: new Date(),
  }
  if(fields.status) {
    lotteryPool.status = fields.status;
  }else{
    lotteryPool.status = 1;
  }
  // 如果hold_on_time存在，则使用hold_on_time，否则使用7天后的时间
  if(fields.hold_on_time) {
    lotteryPool.hold_on_time = fields.hold_on_time;
  }else{
    lotteryPool.hold_on_time = 7 * 24 * 60 * 60 * 1000;
  }
  let end = parseInt(lotteryPool?.hold_on_time.toString())+parseInt(lotteryPool?.create_time.toString());
  lotteryPool.end_date = new Date(end);


  let user_deposit = lotteryPool.user_deposit;
  let total_amount_pool = 0;
  let list = fields.user_deposit.fields.contents;
  for(let i=0;i<list.length;i++){
    let { key, value } = list[i].fields;
    let value_number = (parseInt(value) as number)
    user_deposit.set(key, value_number);
    total_amount_pool += value_number;
  }
  let joined_ticket_array = fields.joined_ticket_numbers.fields.contents;
  for(let i=0;i<joined_ticket_array.length;i++){
    let value = joined_ticket_array[i].fields.value;
    lotteryPool.ticket_sets.add(value)
  }
  lotteryPool.total_amount_pool = total_amount_pool / 1_000_000_000;
  return lotteryPool;
}   
