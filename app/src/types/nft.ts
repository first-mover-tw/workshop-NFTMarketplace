export interface NFT {
  id: string;
  creator: string;
  name: string;
  img_url: string;
}

export type Listing = NFT & {
  price: number;
  owner: string;
};

export interface User {
  id: string;
  address: string;
  name: string;
}
