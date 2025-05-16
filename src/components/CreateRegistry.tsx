import { useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "../constants";
import { addToast, Button } from "@heroui/react";

export default function CreateRegistry({
    isLoading,
    setIsLoading
}: {
    isLoading: boolean,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();

    const { mutateAsync: signTx } = useSignTransaction();

    const handleCreateRegistry = async () => {
        setIsLoading(true);
        console.log("Creating registry...");
        try {
            if (!currentAccount) {
                console.error("No current account found");
                return;
            }
            const tx = new Transaction();
            tx.setGasBudget(10000000);
            const registry = tx.moveCall({
                target: `${PACKAGE_ID}::vault::init_registry`,
                typeArguments: [
                    "0x2::sui::SUI",
                ],
            });
            // tx.moveCall({
            //     target: `0x2::transfer::share_object`,
            //     typeArguments: ["0x86024984844b585af3b5bc7947aaedda8a5fb8b4d97004111c4153473f76c20e::vault::Registry<0x2::sui::SUI>"],
            //     arguments: [registry]
            // })
            tx.transferObjects([registry], currentAccount.address);
            console.log("Registry transaction:", registry);
            const signedTx = await signTx({ transaction: tx });
            const resp = await suiClient.executeTransactionBlock({
                transactionBlock: signedTx.bytes,
                signature: signedTx.signature,
                options: {
                    showEffects: true,
                }
            });
            if (resp?.effects?.status.status === "success") {
                addToast({
                    color: "success",
                    title: "Registry created successfully",
                });
                console.log("Registry created successfully:", resp);
            } else {
                addToast({
                    color: "danger",
                    title: "Failed to create registry",
                });
                console.error("Failed to create registry:", resp?.effects?.status);
            }
        } catch (error) {
            console.error("Error creating registry:", error);
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <>
            <Button onPress={handleCreateRegistry} disabled={isLoading}>Create Registry</Button>
        </>
    )
}