import { NFT_TYPE } from '@/constants';
import { useNetworkVariable } from '@/networkConfig';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';
import { getLotteryTicket, LotteryTicket } from '@/dto/LotteryTicket';


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
            return jsonString.pool_no === lotteryPoolNo && isInPool;
        } catch (error) {
            console.error('Failed to parse JSON:', jsonString, error);
            return false;
        }
    }).map(jsonString => getLotteryTicket(jsonString)).filter(ticket => ticket != null);
    return filteredNfts || [];
}