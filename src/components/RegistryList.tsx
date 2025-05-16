import { useCallback, useEffect, useState } from "react";
import { PACKAGE_ID } from "../constants";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import type { Registry } from "./CreateLock";
import { Select, SelectItem } from "@heroui/react";

export const RegistryList = ({ setRegistry }: {
    setRegistry: React.Dispatch<React.SetStateAction<Registry | null>>;
}) => {
    const [registries, setRegistries] = useState<Registry[]>([]);
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();

    const getRegistries = useCallback(async () => {
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
                StructType: `${PACKAGE_ID}::vault::Registry<0x2::sui::SUI>`,
            }
        });
        setRegistries(res.data.map((data): Registry => {
            const content = data.data?.content as unknown as { fields: Registry };
            return {
                counter: content.fields.counter,
                id: content.fields.id,
                locks: content.fields.locks,
            } as Registry;
        }));
    }, [currentAccount, suiClient, setRegistries]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            getRegistries();
        }, 1000);
        return () => clearInterval(intervalId);
    }, [getRegistries]);

    return (
        <Select label="Select Registry" onSelectionChange={(keys) => {
            const { currentKey } = keys;
            const selectedRegistry = registries.find(registry => registry.id.id === currentKey);
            setRegistry(selectedRegistry || null);
        }}>
            {registries.map((registry) => (
                <SelectItem key={registry.id.id} onSelect={() => setRegistry(registry)}>
                    {registry.id.id}
                </SelectItem>
            ))}
        </Select>
    )
}