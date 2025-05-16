import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Flex } from "@radix-ui/themes"
import { useEffect, useState } from "react"
import { PACKAGE_ID } from "../constants";
import type { LockCap } from "./LockCapList";
import { addToast, Button, Input } from "@heroui/react";
import { bcs } from "@mysten/sui/bcs";
import { fromHex, toHex } from "@mysten/sui/utils";

const Address = bcs.bytes(32).transform({
    input: (val: string) => fromHex(val),
    output: (val) => `0x${toHex(val)}`,
});

export const LockDetails = ({ registryObjId, lockCap }: {
    registryObjId: string | null;
    lockCap: LockCap | null;
}) => {
    const suiClient = useSuiClient();
    const [creator, setCreator] = useState<string>("-");
    const [beneficiary, setBeneficiary] = useState<string>("-");
    const [amount, setAmount] = useState<string>("-");
    const [unlockTime, setUnlockTime] = useState<string>("-");
    const { mutateAsync: signTx } = useSignTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const currentAccount = useCurrentAccount();

    useEffect(() => {
        const getLockDetails = async () => {
            if (!registryObjId || !lockCap || !currentAccount) {
                return;
            }
            setCreator("-");
            setBeneficiary("-");
            setAmount("-");
            setUnlockTime("-");
            // Fetch lock details from the blockchain or API
            const tx = new Transaction();

            console.log("Fetching lock details...", registryObjId, lockCap.lock_id);
            tx.moveCall({
                target: `${PACKAGE_ID}::vault::get_lock_details`,
                arguments: [
                    tx.object(registryObjId),
                    tx.pure.u64(lockCap.lock_id),
                ],
                typeArguments: ["0x2::sui::SUI"],
            });

            const result = await suiClient.devInspectTransactionBlock({
                transactionBlock: tx,
                sender: currentAccount.address
            });

            if (result.effects.status.status !== "success") {
                console.error("Failed to fetch lock details:", result.effects.status);
                return;
            }

            console.log("Lock details result:", result);
            setCreator(Address.parse(Uint8Array.from(result.results![0].returnValues![0][0]!)));
            setBeneficiary(Address.parse(Uint8Array.from(result.results![0].returnValues![1][0]!)));
            setAmount(bcs.u64().parse(Uint8Array.from(result.results![0].returnValues![2][0]!)));
            setUnlockTime(bcs.u64().parse(Uint8Array.from(result.results![0].returnValues![3][0]!)));
        }

        getLockDetails();
    }, [registryObjId, lockCap, suiClient, currentAccount]);

    const handleClaim = async () => {
        setIsLoading(true);
        try {
            if (!registryObjId || !lockCap) {
                console.error("Missing registry object ID or lockCap");
                return;
            }
            const tx = new Transaction();
            tx.setGasBudget(10000000);
            const claimedTokens = tx.moveCall({
                target: `${PACKAGE_ID}::vault::claim_tokens`,
                arguments: [
                    tx.object(registryObjId),
                    tx.object(lockCap.id.id),
                    tx.object("0x6")
                ],
                typeArguments: ["0x2::sui::SUI"]
            });
            tx.transferObjects([claimedTokens], lockCap.beneficiary);
            const signedTx = await signTx({ transaction: tx });
            const claimResult = await suiClient.executeTransactionBlock({
                transactionBlock: signedTx.bytes,
                signature: signedTx.signature,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });
            console.log("Claim result:", claimResult);
            if (claimResult.effects?.status.status === "success") {
                addToast({
                    color: "success",
                    title: "Successfully claimed tokens",
                });
            } else {
                addToast({
                    color: "danger",
                    title: "Claim transaction failed",
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Flex direction="column" gap="2">
            <Input label="Lock object ID" type="text" value={lockCap?.id.id || ""} readOnly />
            <Input label="Lock ID" type="text" value={lockCap?.lock_id || ""} readOnly />
            <Input label="Creator" type="text" value={creator} readOnly />
            <Input label="Beneficiary" type="text" value={beneficiary} readOnly />
            <Input label="Amount (MIST)" value={amount} readOnly />
            <Input label="Unlock Time (ms)" value={unlockTime} readOnly />
            <Button onPress={handleClaim} isDisabled={isLoading}>Claim Tokens</Button>
        </Flex>
    )
}