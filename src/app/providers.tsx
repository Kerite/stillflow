"use client"

import { ConnectButton, createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import styles from "./page.module.css"
import Link from "next/link";
import React from "react"
import { Button } from "@/styled";

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
                            <Link href="/locks" className={styles.backLink}>
                                <Button>
                                    My Locks
                                </Button>
                            </Link>
                            <ConnectButton />
                        </div>
                        {children}
                    </div>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    )
}