import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { type NFT } from "../types/nft";
import { ShoppingCart, Tag, Grid3X3 } from "lucide-react";
import {
  ConnectButton,
  useCurrentAccount,
  useSuiClient,
} from "@mysten/dapp-kit";
import {
  useBuyRookieNFT,
  useDelistRookieNFT,
  useGetMarketPlaceNFT,
  useGetOwnedRookie,
  useListRookieNFT,
} from "@/hooks/queries/use-rookie";
import { useQueryClient } from "@tanstack/react-query";

export function NFTMarketplace() {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { data: ownedRookieNFT } = useGetOwnedRookie(
    suiClient,
    account?.address,
  );
  const { data: marketPlaceNFT } = useGetMarketPlaceNFT(suiClient);

  const [listingPrice, setListingPrice] = useState<string>("");
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [nft, setNfts] = useState<NFT[]>([]);

  const { mutateAsync: listRookieNFT } = useListRookieNFT(suiClient);
  const handleListNFT = async (nftId: string, price: number) => {
    await listRookieNFT({
      rookieNFTID: nftId,
      price: BigInt(Math.floor(price * 10 ** 9)),
    });
    setNfts((prev) =>
      prev.map((nft) =>
        nft.id === nftId ? { ...nft, isListed: true, price } : nft,
      ),
    );
    setListingPrice("");
    setSelectedNFT(null);
  };

  const { mutateAsync: delistRookieNFT } = useDelistRookieNFT(suiClient);
  const handleDelistNFT = async (nftId: string) => {
    if (!account) return;

    await delistRookieNFT({
      rookieNFTID: nftId,
      recipient: account.address,
    });
    setNfts((prev) =>
      prev.map((nft) =>
        nft.id === nftId ? { ...nft, isListed: false, price: undefined } : nft,
      ),
    );
  };

  const [payment, setPayment] = useState<string>("");
  const { mutateAsync: buy } = useBuyRookieNFT(suiClient);
  const handleBuyNFT = async (nftId: string) => {
    if (!account) return;

    const value = BigInt(Math.floor(+payment * 10 ** 9));
    await buy({
      rookieNFTID: nftId,
      recipient: account.address,
      payment: value,
    });
    setNfts((prev) =>
      prev.map((nft) =>
        nft.id === nftId
          ? {
              ...nft,
              owner: account?.address || "",
              isListed: false,
              price: undefined,
            }
          : nft,
      ),
    );
  };

  const listedNFT = useMemo(
    () => marketPlaceNFT?.filter((nft) => nft.owner === account?.address) || [],
    [marketPlaceNFT, account],
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">NFT Marketplace</h1>
        <div className="flex items-center gap-2">
          <ConnectButton />
        </div>
      </div>

      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="my-nfts" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            My NFTs
          </TabsTrigger>
          <TabsTrigger value="my-listings" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            My Listings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">Browse NFTs</h2>
            <p className="text-muted-foreground">
              Discover and purchase unique NFTs from other creators
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {marketPlaceNFT?.map((nft) => (
              <Card
                key={nft.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={nft.img_url.length ? nft.img_url : "/placeholder.svg"}
                    alt={nft.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{nft.name}</CardTitle>
                  <CardDescription className="break-all text-sm text-muted-foreground">
                    {nft.id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">Listed</Badge>
                    <span className="text-2xl font-bold">
                      {nft.price / 10 ** 9} SUI
                    </span>
                  </div>
                  <Button
                    onClick={() => handleBuyNFT(nft.id)}
                    className="w-full mb-4"
                  >
                    Buy Now
                  </Button>
                  <Input
                    id="payment"
                    type="number"
                    step="0.0001"
                    placeholder="Enter price in SUI"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          {!marketPlaceNFT?.length && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No NFTs available for purchase at the moment.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-nfts" className="mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">My Collection</h2>
            <p className="text-muted-foreground">Manage your owned NFTs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ownedRookieNFT?.map((nft) => {
              const nftIndex =
                marketPlaceNFT?.findIndex((nft) => nft.id === nft.id) || 0;

              const isListed = nftIndex > 0;
              return (
                <Card key={nft.id} className="overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={
                        nft.img_url.length ? nft.img_url : "/placeholder.svg"
                      }
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{nft.name}</CardTitle>
                    <CardDescription className="break-all text-sm text-muted-foreground">
                      {nft.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={isListed ? "default" : "outline"}>
                        {isListed
                          ? `Listed for ${marketPlaceNFT?.[nftIndex].price || 0} SUI`
                          : "Not Listed"}
                      </Badge>
                    </div>
                    {!isListed ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => setSelectedNFT(nft)}
                            className="w-full"
                          >
                            List for Sale
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>List NFT for Sale</DialogTitle>
                            <DialogDescription>
                              Set a price for your NFT to list it on the
                              marketplace
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="price">Price (SUI)</Label>
                              <Input
                                id="price"
                                type="number"
                                step="0.0001"
                                placeholder="Enter price in SUI"
                                value={listingPrice}
                                onChange={(e) =>
                                  setListingPrice(e.target.value)
                                }
                              />
                            </div>
                            <Button
                              onClick={() => {
                                if (selectedNFT && listingPrice) {
                                  handleListNFT(
                                    selectedNFT.id,
                                    parseFloat(listingPrice),
                                  );
                                }
                              }}
                              className="w-full"
                              disabled={
                                !listingPrice || parseFloat(listingPrice) <= 0
                              }
                            >
                              List NFT
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button
                        onClick={() => handleDelistNFT(nft.id)}
                        variant="outline"
                        className="w-full"
                      >
                        Delist NFT
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {!ownedRookieNFT?.length && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You don't own any NFTs yet.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-listings" className="mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">My Active Listings</h2>
            <p className="text-muted-foreground">
              NFTs you have listed for sale
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {marketPlaceNFT
              ?.filter((nft) =>
                listedNFT.some((listing) => listing.id === nft.id),
              )
              .map((nft) => (
                <Card key={nft.id} className="overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={
                        nft.img_url.length ? nft.img_url : "/placeholder.svg"
                      }
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{nft.name}</CardTitle>
                    <CardDescription className="break-all text-sm text-muted-foreground">
                      {nft.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <Badge>Listed</Badge>
                      <span className="text-xl font-bold">
                        {nft.price / 10 ** 9} SUI
                      </span>
                    </div>
                    <Button
                      onClick={() => handleDelistNFT(nft.id)}
                      variant="destructive"
                      className="w-full"
                    >
                      Delist NFT
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
          {listedNFT.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You have no active listings.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
