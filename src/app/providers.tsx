"use client"

import { ConnectButton, createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react"

const { networkConfig } = createNetworkConfig({
    localnet: { url: getFullnodeUrl('localnet') },
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
});

const queryClient = new QueryClient();

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
                <WalletProvider autoConnect={true}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                    }}>
                        <div style={{ marginLeft: "auto", padding: "10px" }}>
                            <ConnectButton />
                        </div>
                        {children}
                    </div>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    )
}