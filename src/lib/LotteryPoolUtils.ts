import { NFT_TYPE,TICKET_WIN_EVENT,LOTTERY_POOL_TYPE } from '@/constants';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';
import { getLotteryTicket, LotteryTicket } from '@/dto/LotteryTicket';
import {WinnerTicket, getWinnerTickets, LotteryPool, getLotteryPools} from '@/dto/LotteryPool';

const queryAllObjectQL = graphql(`
query($type: String!) {
      objects(filter: { type: $type }) {
        edges {
          node {
            asMoveObject {
              contents {
                json
              }
            }
          }
        }
      }
}
`);
const queryMyTicketsQL = graphql(`
    query($address: SuiAddress!, $nftType: String!) {
      address(address: $address) {
        objects(filter: { type: $nftType }) {
          edges {
            node {
              contents {
                json
              }
            }
          }
        }
      }
    }
  `);
const queryHistoryWinnerQL = graphql(`
  query($eventType: String!) {
    events(filter: { eventType: $eventType }) {
      edges {
        node {
          transactionBlock {
            digest
          }
          sender {
            address
          }
          timestamp
          contents {
            json
          }
        }
      }
    }
  }
`);

export const getUsetTickets = async (address: string, lotteryPoolNo: string, graphqlUrl: string): Promise<Array<LotteryTicket>> => {
    const suiGraphQLClient = new SuiGraphQLClient({
        url: graphqlUrl,
    })

    const result = await suiGraphQLClient.query({
        query: queryMyTicketsQL,
        variables: {
            address,
            nftType: NFT_TYPE,
        },
    });
    const nfts = result.data?.address?.objects?.edges.map(edge => edge.node.contents?.json);
    // 在客户端对JSON字段进行过滤
    const filteredNfts = nfts?.filter(jsonString => {
        try {
            //todo 待补充判断 是否是有效的ticket
            let isInPool = true;
            return (jsonString as any).pool_no === lotteryPoolNo && isInPool;
        } catch (error) {
            console.error('Failed to parse JSON:', jsonString, error);
            return false;
        }
    }).map(jsonString => getLotteryTicket(jsonString)).filter(ticket => ticket != null);
    return filteredNfts || [];
}


export const getHistoryWinners = async (graphqlUrl: string): Promise<Array<WinnerTicket>> => {
  const suiGraphQLClient = new SuiGraphQLClient({
    url: graphqlUrl,
  })

  const result = await suiGraphQLClient.query({
      query: queryHistoryWinnerQL,
      variables: {
          eventType: TICKET_WIN_EVENT,
      },
  });

  const tickets_win_events_node = result.data?.events?.edges?.map(edge => edge.node);
  return getWinnerTickets(tickets_win_events_node);
}

export const getAllLotteryPool = async (graphqlUrl: string) : Promise<Map<string,LotteryPool>> =>{
  const suiGraphQLClient = new SuiGraphQLClient({
    url: graphqlUrl,
  })
  const queryResult = await suiGraphQLClient.query({
    query: queryAllObjectQL,
    variables: {
        type: LOTTERY_POOL_TYPE,
    },
  });
  const allLotteryPool = queryResult.data?.objects?.edges?.map(edge => edge.node.asMoveObject?.contents?.json);
  const result = new Map();
  getLotteryPools(allLotteryPool).forEach(item => {
    result.set(item.id, item);
  })
  return result;
}