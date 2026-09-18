// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      userId: string | null;
      userName: string | null;
      sessionType: string | null;
      walletAddress: string | null;
      web3UserId: string | null;
      linkedWalletAddress: string | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {
    solana?: any;
    solflare?: any;
    backpack?: any;
  }
}

export {};
