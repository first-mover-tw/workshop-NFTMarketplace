import {
  NFT_MARKET_PLACE_ID,
  PACKAGE_ADDRESS,
  PUBLISHED_AT,
} from "@/lib/const";
import { toast } from "sonner";
import type { Listing, NFT } from "@/types/nft";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import type { SuiClient } from "@mysten/sui/client";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetMarketPlaceNFT = (suiClient: SuiClient) => {
  return useQuery({
    queryKey: ["marketPlaceNFT"],
    queryFn: async () => {
      const dfKeys = await suiClient.getDynamicFields({
        parentId: NFT_MARKET_PLACE_ID,
      });

      console.log({ dfKeys });

      const objectIds = dfKeys.data.map((d) => d.objectId);

      // sequent calling
      const nftResponse = await suiClient.multiGetObjects({
        ids: objectIds,
        options: { showContent: true },
      });

      const listing: Listing[] = [];

      nftResponse.forEach((res, idx) => {
        const content = res?.data?.content;
        if (content && content.dataType === "moveObject") {
          const type = dfKeys.data[idx].type;
          // dof
          if (type === "DynamicObject") {
            const fields = content.fields as any;
            const itemFields = fields.item.fields;

            listing.push({
              price: Number(fields.price),
              owner: fields.owner,
              id: itemFields.id.id,
              creator: itemFields.creator,
              name: itemFields.name,
              img_url: itemFields.img_url,
            });
          } else {
            const fields = (content.fields as any).value.fields;
            const itemFields = fields.item.fields;

            listing.push({
              price: Number(fields.price),
              owner: fields.owner,
              id: itemFields.id.id,
              creator: itemFields.creator,
              name: itemFields.name,
              img_url: itemFields.img_url,
            });
          }
        }
      });

      return listing;
    },
  });
};

export const useGetOwnedRookie = (suiClient: SuiClient, address?: string) => {
  return useQuery({
    queryKey: ["rookie", address],
    queryFn: async () => {
      const res = await suiClient.getOwnedObjects({
        owner: address!,
        filter: {
          StructType: `${PACKAGE_ADDRESS}::lesson_one::Rookie`,
        },
        options: {
          showContent: true,
        },
      });

      const nft: NFT[] = [];
      res.data.forEach((d) => {
        const content = d?.data?.content;
        if (content && content.dataType === "moveObject") {
          const fields = content.fields as any;

          nft.push({
            id: fields.id.id,
            creator: fields.creator,
            name: fields.name,
            img_url: fields.img_url,
          });
        }
      });

      return nft;
    },
    enabled: !!address,
  });
};

// --- Mutation ---
export const useListRookieNFT = (suiClient: SuiClient) => {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransaction({
      execute: async ({ bytes, signature }) =>
        await suiClient.executeTransactionBlock({
          transactionBlock: bytes,
          signature,
          options: {
            // Raw effects are required so the effects can be reported back to the wallet
            showRawEffects: true,
            // Select additional data to return
            // showObjectChanges: true,
          },
        }),
    });

  return useMutation({
    mutationKey: ["list Rookie NFT"],
    mutationFn: async ({
      isDynamicField = true,
      rookieNFTID,
      price,
    }: {
      isDynamicField?: boolean;
      rookieNFTID: string;
      price: bigint;
    }) => {
      const tx = new Transaction();

      // tx_1
      tx.moveCall({
        target: `${PUBLISHED_AT}::lesson_one::${isDynamicField ? "list_rookie_with_df" : "list_rookie_with_dof"}`,
        arguments: [
          tx.object(NFT_MARKET_PLACE_ID),
          tx.object(rookieNFTID),
          tx.pure.u64(price),
        ],
      });

      await signAndExecuteTransactionBlock({ transaction: tx });

      return;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["marketPlaceNFT"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["rookie", account?.address],
      });
    },
  });
};

export const useDelistRookieNFT = (suiClient: SuiClient) => {
  const queryClient = useQueryClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          // Select additional data to return
          // showObjectChanges: true,
        },
      }),
  });

  return useMutation({
    mutationKey: ["delist Rookie NFT"],
    mutationFn: async ({
      isDynamicField = true,
      rookieNFTID,
      recipient,
    }: {
      isDynamicField?: boolean;
      rookieNFTID: string;
      recipient: string;
    }) => {
      // transaction logic
      const tx = new Transaction();

      // tx_1
      const nft = tx.moveCall({
        target: `${PUBLISHED_AT}::lesson_one::${isDynamicField ? "delist_rookie_with_df" : "delist_rookie_with_dof"}`,
        arguments: [tx.object(NFT_MARKET_PLACE_ID), tx.object(rookieNFTID)],
      });

      // tx_2
      tx.transferObjects([nft], recipient);

      // finish tx
      await signAndExecuteTransaction({ transaction: tx });

      return;
    },
    onSuccess: async (data, { recipient }) => {
      await queryClient.invalidateQueries({
        queryKey: ["marketPlaceNFT"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["rookie", recipient],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useBuyRookieNFT = (suiClient: SuiClient) => {
  const queryClient = useQueryClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          // Select additional data to return
          // showObjectChanges: true,
        },
      }),
  });

  return useMutation({
    mutationKey: ["buy Rookie NFT"],
    mutationFn: async ({
      rookieNFTID,
      payment,
      recipient,
    }: {
      rookieNFTID: string;
      payment: bigint;
      recipient: string;
    }) => {
      const tx = new Transaction();

      console.log({ tx: tx.getData().commands });
      await signAndExecuteTransaction({ transaction: tx });

      return;
    },
    onSuccess: async (data, { recipient }) => {
      await queryClient.invalidateQueries({
        queryKey: ["marketPlaceNFT"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["rookie", recipient],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
