/**
 * {
                  "id": "0xe356b8e6edbad9e5596f6951667bc3ccffec45606c7ea60dadf5a0bef57e85a3",
                  "name": "shizi",
                  "description": "shizi",
                  "link": "https://lucky1sui.com",
                  "image_url": "https://www.helloimg.com/i/2025/04/08/67f52fcb41139.jpg",
                  "project_url": "https://lucky1sui.com",
                  "creator": "LuckyOneSui",
                  "ticket_number_set": [
                    "211744290830232"
                  ],
                  "pool_no": "2"
                }
 */
export interface LotteryTicket {
    id: string;
    name: string;
    description: string;
    link: string;
    image_url: string;
    project_url: string;
    creator: string;
    ticket_number_set: string[];
    pool_no: number;
    }

export function getLotteryTicket(data: any): LotteryTicket | null {
    if(!data) return null;

    let lotteryTicket: LotteryTicket = {
        id: data.id,
        name: data.name,
        description: data.description,
        link: data.link,  
        image_url: data.image_url,
        project_url: data.project_url,
        creator: data.creator,
        ticket_number_set: data.ticket_number_set,
        pool_no: parseInt(data.pool_no) as number,
    }
    return lotteryTicket;
}