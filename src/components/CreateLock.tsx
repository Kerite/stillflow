import { useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID } from "../constants";
import { useState } from "react";
import { Flex } from "@radix-ui/themes";
import { addToast, Button, Input, NumberInput } from "@heroui/react";

export interface Registry {
    counter: string;
    id: {
        id: string;
    };
    locks: {
        type: string;
        fields: {
            id: string;
            size: string;
        }
    };
}

export const CreateLock = (params: {
    isLoading: boolean,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    registry: Registry | null;
}) => {
    const { isLoading, setIsLoading, registry } = params;
    const { mutateAsync: execute } = useSignTransaction();
    const suiClient = useSuiClient();
    const [targetAccount, setTargetAccount] = useState<string>("");
    const [expireTime, setExpireTime] = useState<number>(100_000);
    const [amount, setAmount] = useState<number>(100_000);

    const handleCreateLock = async () => {
        if (isLoading) return;
        console.log("Creating lock...");
        setIsLoading(true);
        try {
            console.log("Registry:", registry);
            if (!registry) {
                console.error("No registry found");
                return;
            }
            const tx = new Transaction();
            tx.setGasBudget(10000000);
            const [coinToLock] = tx.splitCoins(tx.gas, [amount]);
            const [, lockCap] = tx.moveCall({
                target: `${PACKAGE_ID}::vault::create_lock`,
                typeArguments: [
                    `0x2::sui::SUI`,
                ],
                arguments: [
                    tx.object(registry.id.id),
                    coinToLock,
                    tx.pure.address(targetAccount),
                    tx.pure.u64(expireTime),
                    tx.object("0x6")
                ]
            });
            tx.transferObjects([lockCap], targetAccount);
            const signedTx = await execute({
                transaction: tx
            });
            const resp = await suiClient.executeTransactionBlock({
                transactionBlock: signedTx.bytes,
                signature: signedTx.signature,
                options: {
                    showEffects: true,
                    showEvents: true,
                }
            });
            if (resp.effects?.status.status === "success") {
                console.log("Lock created successfully:", resp);
                addToast({
                    color: "success",
                    title: "Successfully created lock",
                });
            } else {
                addToast({
                    color: "danger",
                    title: "Failed to create lock",
                });
                console.error("Failed to create lock:", resp);
            }
        } catch (error) {
            console.error("Error creating lock:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Flex direction="column" gap="2">
            <Input label="Beneficiary" type="text" value={targetAccount} onValueChange={setTargetAccount} />
            <NumberInput label="Expire Time (in ms)" value={expireTime} onValueChange={setExpireTime} />
            <NumberInput label="Amount (MIST)" value={amount} onValueChange={setAmount} />
            <Button onPress={handleCreateLock} isDisabled={registry === null || isLoading}>Create Lock</Button>
        </Flex>
    )
}