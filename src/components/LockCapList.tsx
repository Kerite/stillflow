import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useCallback, useEffect, useState } from "react"
import { PACKAGE_ID } from "../constants";
import { Select, SelectItem } from "@heroui/react";
import { number } from "framer-motion";

export interface LockCap {
    beneficiary: string;
    id: {
        id: string;
    };
    lock_id: string;
}

export const LockCapList = ({
    setLockCap
}: {
    setLockCap: React.Dispatch<React.SetStateAction<LockCap | null>>;
}) => {
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const [lockCaps, setLockCaps] = useState<LockCap[]>([]);

    const getLocks = useCallback(async () => {
        if (!currentAccount) {
            return;
        }
        const res = await suiClient.getOwnedObjects({
            owner: currentAccount?.address,
            options: {
                showContent: true,
                showType: true,
            },
            filter: {
                StructType: `${PACKAGE_ID}::vault::LockCap`,
            }
        });
        setLockCaps(res.data.map((data): LockCap => {
            const content = data.data?.content as unknown as { fields: LockCap };
            return { ...content.fields };
        }).sort((a, b) => number.parse(a.lock_id) - number.parse(b.lock_id)));
    }, [currentAccount, suiClient]);

    useEffect(() => {
        const interval = setInterval(() => {
            getLocks();
        }, 1000);
        return () => clearInterval(interval);
    }, [getLocks]);

    return (
        <Select label="Select LockCap" onSelectionChange={(keys) => {
            const { currentKey } = keys;
            const selectedLockCap = lockCaps.find(lockCap => lockCap.id.id === currentKey);
            setLockCap(selectedLockCap || null);
        }}>
            {lockCaps.length > 0 ? lockCaps.map((lockCap) => (
                <SelectItem key={lockCap.id.id}>{lockCap.id.id}</SelectItem>
            )) : (
                <>
                </>
            )}
        </Select>
    )
}