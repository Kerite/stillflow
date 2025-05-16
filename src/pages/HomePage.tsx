import { useState } from "react";
import CreateRegistry from "../components/CreateRegistry";
import { CreateLock, type Registry } from "../components/CreateLock";
import { RegistryList } from "../components/RegistryList";
import { Card, CardBody, Input } from "@heroui/react";
import { LockCapList, type LockCap } from "../components/LockCapList";
import { LockDetails } from "../components/LockDetails";

export function HomePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [registry, setRegistry] = useState<Registry | null>(null);
    const [lockCap, setLockCap] = useState<LockCap | null>(null);

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            gap: "20px",
            padding: "20px"
        }}>
            <div style={{
                width: "200px",
                padding: "10px"
            }}>
            </div>
            <div style={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                gap: 15
            }}>
                <CreateRegistry
                    isLoading={isLoading}
                    setIsLoading={setIsLoading} />
                <RegistryList setRegistry={setRegistry} />
                <Card>
                    <CardBody style={{ gap: 15 }}>
                        <Input label="Current Registry ID" type="text" value={registry?.id.id || ""} readOnly />
                        <CreateLock
                            isLoading={isLoading}
                            setIsLoading={setIsLoading}
                            registry={registry} />
                    </CardBody>
                </Card>
                {registry && <LockCapList setLockCap={setLockCap} />}
                <Card>
                    <CardBody>
                        <LockDetails registryObjId={registry?.id.id || null} lockCap={lockCap} />
                    </CardBody>
                </Card>
            </div>
            <div style={{
                width: "200px",
                padding: "10px"
            }}>
            </div>
        </div>
    );
}