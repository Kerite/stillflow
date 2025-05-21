'use client';

import React, { useState, FormEvent, use, useCallback, useEffect } from 'react'; // 导入 use
import styles from './lock.module.css';
import Link from 'next/link';
import { useCurrentAccount, useSignTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CREATED_REGISTRIES, PACKAGE_ID, REFRESH_RATE } from '@/constants';
import { bcs } from '@mysten/sui/bcs';
import { Address } from '@/utils';

interface LockItemData {
    id: string;
    creator: string;
    owner: string;
    token: string;
    quantity: number;
    expiryDate: string;
    moduleSlug: string; // 记录这个 lock 属于哪个模块
    claimed: boolean;
}

// 假设的代币选项
const tokenOptions = [
    { value: 'sui', label: 'SUI' },
    { value: 'usdc', label: 'USDC' },
    { value: 'usdt', label: 'USDT' },
];

export default function LockPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
    const params = use(paramsPromise); // 使用 React.use 解构 params

    const { slug: registryObjectId } = params;
    const currentAccount = useCurrentAccount();
    const [lockDetails, setLockDetails] = useState<{ title: string; iconText: string }>({
        title: 'Lock Details',
        iconText: 'Goal'
    });
    const { mutateAsync: signTx } = useSignTransaction();

    const suiClient = useSuiClient();

    const [locks, setLocks] = useState<LockItemData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState<string>(tokenOptions[0].value);
    const [tokenQuantity, setTokenQuantity] = useState<number | ''>('');
    const [selectedLockDetail, setSelectedLockDetail] = useState<LockItemData | null>(null); // 新增 state

    const [transferAddress, setTransferAddress] = useState<string>('');

    const loadDetails = useCallback(async () => {
        if (!registryObjectId || !currentAccount) {
            return;
        }
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::bank::get_registry`,
            arguments: [
                tx.object(registryObjectId)
            ]
        });
        const result = await suiClient.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: currentAccount.address
        });
        const returnValues = result.results![0].returnValues!;
        // const lockIds = bcs.vector(bcs.u64()).parse(Uint8Array.from(returnValues[4][0]));
        const lockAddresses = bcs.vector(Address).parse(Uint8Array.from(returnValues[5][0]));
        const data = {
            name: bcs.string().parse(Uint8Array.from(returnValues[0][0])),
            description: bcs.string().parse(Uint8Array.from(returnValues[1][0])),
            unlockTime: bcs.u64().parse(Uint8Array.from(returnValues[2][0])),
            lockCount: bcs.u64().parse(Uint8Array.from(returnValues[3][0])),
            beneficiary: Address.parse(Uint8Array.from(returnValues[6][0])),
            locks: await Promise.all(lockAddresses.map(async (lockAddress): Promise<LockItemData> => {
                // Fetch lock details from the blockchain or API
                const tx = new Transaction();

                tx.moveCall({
                    target: `${PACKAGE_ID}::bank::get_lock_details`,
                    arguments: [
                        tx.object(lockAddress)
                    ],
                    typeArguments: ["0x2::sui::SUI"],
                });

                const result = await suiClient.devInspectTransactionBlock({
                    transactionBlock: tx,
                    sender: currentAccount.address
                });

                console.log("get_lock_details result", result);

                if (result.effects.status.status !== "success") {
                    throw new Error(`Transaction failed: ${result.effects.status.error}`);
                }

                const returnValues = result.results![0].returnValues!;

                return {
                    creator: Address.parse(Uint8Array.from(returnValues[0][0])),
                    id: lockAddress,
                    token: 'sui',
                    quantity: Number(bcs.u64().parse(Uint8Array.from(returnValues[1][0]))),
                    expiryDate: new Date(Number(bcs.u64().parse(Uint8Array.from(returnValues[2][0])))).toLocaleString(), // 默认到期日期为一个月后
                    moduleSlug: registryObjectId,
                    claimed: bcs.bool().parse(Uint8Array.from(returnValues[3][0])),
                    // @ts-expect-error the type is correct
                    owner: `${result.effects.mutated?.find(x => x.reference.objectId === lockAddress)?.owner.AddressOwner}` || "",
                }
            })),
        }
        setLockDetails({
            title: data.name,
            iconText: data.description,
        });
        setLocks(data.locks);
    }, [currentAccount, registryObjectId, suiClient]);

    useEffect(() => {
        const intervalId = setInterval(loadDetails, REFRESH_RATE);
        return () => clearInterval(intervalId);
    }, [loadDetails]);

    const handleOpenModal = async () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedToken(tokenOptions[0].value);
        setTokenQuantity('');
    };

    const handleSubmitNewLock = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (tokenQuantity === '' || tokenQuantity <= 0) {
            alert('代币数量必须大于0');
            return;
        }

        if (!registryObjectId) {
            console.error("No registry found");
            return;
        }
        const tx = new Transaction();
        tx.setGasBudget(10000000);
        const [coinToLock] = tx.splitCoins(tx.gas, [tokenQuantity]);
        tx.moveCall({
            target: `${PACKAGE_ID}::bank::create_lock`,
            typeArguments: [
                `0x2::sui::SUI`,
            ],
            arguments: [
                tx.object(registryObjectId),
                coinToLock,
            ]
        });
        // tx.transferObjects([lockCap], targetAccount);
        const signedTx = await signTx({
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
            alert("Lock created successfully!");
        } else {
            alert("Failed to create lock");
        }
        handleCloseModal();
    };

    const handleLockItemClick = (lock: LockItemData) => { // 新增点击处理函数
        setSelectedLockDetail(lock);
    };

    // 过滤当前模块的 locks
    const currentModuleLocks = locks.filter(lock => lock.moduleSlug === registryObjectId);

    const handleAddToHomepage = () => {
        const previousList = JSON.parse(localStorage.getItem(CREATED_REGISTRIES) || '[]');
        const newList = new Set([...previousList, registryObjectId]);
        localStorage.setItem(CREATED_REGISTRIES, JSON.stringify(Array.from(newList)));
        alert("Added Goal to homepage");
    }

    const handleTransfer = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!currentAccount) {
            alert('请先连接钱包');
            return;
        }
        if (!selectedLockDetail) {
            console.error("Missing registry object ID or lockCap");
            return;
        }

        console.log("Transfering lock", selectedLockDetail.id, "to", transferAddress);
        const tx = new Transaction();
        tx.setGasBudget(10000000);
        tx.moveCall({
            target: `${PACKAGE_ID}::bank::transfer_lock`,
            arguments: [
                tx.object(selectedLockDetail.id),
                tx.pure.address(transferAddress),
            ],
            typeArguments: ["0x2::sui::SUI"]
        });
        const signedTx = await signTx({ transaction: tx });
        const result = await suiClient.executeTransactionBlock({
            transactionBlock: signedTx.bytes,
            signature: signedTx.signature,
            options: {
                showEffects: true,
                showEvents: true,
            }
        });
        if (result.effects?.status.status === "success") {
            alert("Transfer transaction successful!");
        } else {
            console.error("Transfer transaction failed:", result.effects?.status.error);
            alert("Transfer transaction failed");
        }
    }

    const handleClaim = async () => {
        if (!currentAccount) {
            alert('请先连接钱包');
            return;
        }
        if (!selectedLockDetail || !currentAccount) {
            console.error("Missing registry object ID or lockCap");
            return;
        }
        const tx = new Transaction();
        tx.setGasBudget(10000000);
        const claimedTokens = tx.moveCall({
            target: `${PACKAGE_ID}::bank::claim_tokens`,
            arguments: [
                tx.object(selectedLockDetail.id),
                tx.object("0x6")
            ],
            typeArguments: ["0x2::sui::SUI"]
        });
        tx.transferObjects([claimedTokens], currentAccount.address);
        const signedTx = await signTx({ transaction: tx });
        const claimResult = await suiClient.executeTransactionBlock({
            transactionBlock: signedTx.bytes,
            signature: signedTx.signature,
            options: {
                showEffects: true,
                showEvents: true,
            }
        });
        if (claimResult.effects?.status.status === "success") {
            alert("Claim transaction successful!");
        } else {
            console.error("Claim transaction failed:", claimResult.effects?.status.error);
            alert("Claim transaction failed");
        }
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.icon}>{lockDetails.iconText}</div>
                    <h1 className={styles.title}>{lockDetails.title}</h1>
                </div>

                <div className={styles.content}>
                    <div className={styles.locksSection}>
                        <h2 className={styles.sectionTitle}>Locks ({currentModuleLocks.length})</h2>
                        <div className={styles.actionButtons}>
                            <button className={styles.button} onClick={handleOpenModal}>+ Add</button>
                            <button className={styles.button}>discover</button>
                        </div>
                        <div className={styles.lockList}>
                            {currentModuleLocks.length > 0 ? (
                                currentModuleLocks.map((lock, index) => (
                                    <div
                                        className={`${styles.lockItem} ${selectedLockDetail?.id === lock.id ? styles.selectedLock : ''}`} // 添加选中样式
                                        key={lock.id}
                                        onClick={() => handleLockItemClick(lock)} // 添加点击事件
                                    >
                                        <span>
                                            Lock #{index + 1}: {lock.quantity} {lock.token.toUpperCase()}
                                        </span>
                                        <span>
                                            Expires: {lock.expiryDate}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noLocksText}>There are no Locks, click &quot;+ Add&quot; to create one!</p>
                            )}
                        </div>
                    </div>

                    <div className={styles.detailsSection}>
                        <h2 className={styles.sectionTitle}>
                            {selectedLockDetail ? `Details for Lock #${currentModuleLocks.findIndex(l => l.id === selectedLockDetail.id) + 1}` : 'Lock Details'}
                        </h2>
                        <div className={styles.descriptionBox}>
                            {selectedLockDetail ? (
                                <>
                                    <p>
                                        <strong>ID:</strong>
                                        <span onClick={() => { navigator.clipboard.writeText(selectedLockDetail.id) }} className={styles.copyable}>
                                            {`${selectedLockDetail.id.substring(0, 12)}...${selectedLockDetail.id.substring(selectedLockDetail.id.length - 10)}`}
                                        </span>
                                    </p>
                                    <p><strong>Token:</strong> {selectedLockDetail.token.toUpperCase()}</p>
                                    <p><strong>Quantity:</strong> {selectedLockDetail.quantity}</p>
                                    <p><strong>Expires:</strong> {selectedLockDetail.expiryDate}</p>
                                    <p>
                                        <strong>Owner:</strong>
                                        <span onClick={() => { navigator.clipboard.writeText(selectedLockDetail.owner) }} className={styles.copyable}>
                                            {`${selectedLockDetail.owner.substring(0, 12)}...${selectedLockDetail.owner.substring(selectedLockDetail.owner.length - 10)}`}
                                        </span>
                                    </p>
                                    <p>
                                        <strong>Creator:</strong>
                                        <span onClick={() => { navigator.clipboard.writeText(selectedLockDetail.creator) }} className={styles.copyable}>
                                            {`${selectedLockDetail.creator.substring(0, 12)}...${selectedLockDetail.creator.substring(selectedLockDetail.creator.length - 10)}`}
                                        </span>
                                    </p>
                                    <p><strong>Claimed:</strong> {selectedLockDetail.claimed ? 'Yes' : 'No'}</p>
                                    {/* <p><strong>Module:</strong> {selectedLockDetail.moduleSlug}</p> */}
                                </>
                            ) : (
                                <p>Click Lock on the left to view details</p>
                            )}
                        </div>
                        {selectedLockDetail && ( // 仅当有 Lock 被选中时显示操作按钮
                            <div className={styles.financialActions}>
                                <button onClick={() => setIsTransferModalOpen(true)} className={`${styles.button} ${styles.transferButton}`}>transfer</button>
                                <button onClick={handleClaim} className={`${styles.button} ${styles.withdrawButton}`}>withdraw</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.backLinkContainer}>
                    <Link href="/registrar" className={styles.backLink}>
                        &larr; Back to Homepage
                    </Link>
                    <button onClick={handleAddToHomepage} className={`${styles.button}`}>
                        Add Goal to Homepage
                    </button>
                </div>
            </div>

            {isTransferModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Transfer Lock {lockDetails.title}</h2>
                        <form onSubmit={handleTransfer}>
                            <div>
                                <label htmlFor="targetAddress">Recipient Address:</label>
                                <input
                                    type="text"
                                    id="targetAddress"
                                    value={transferAddress}
                                    onChange={(e) => setTransferAddress(e.target.value)}
                                    required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.modalButton}>Transfer</button>
                                <button type="button" className={styles.modalButton} onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Create New Lock for {lockDetails.title}</h2>
                        <form onSubmit={handleSubmitNewLock}>
                            <div className={styles.formGroup}>
                                <label htmlFor="tokenSelect">Select Token:</label>
                                <select
                                    id="tokenSelect"
                                    value={selectedToken}
                                    onChange={(e) => setSelectedToken(e.target.value)}
                                    className={styles.formInput}
                                >
                                    {tokenOptions.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="tokenQuantity">Token Amount(MIST):</label>
                                <input
                                    type="number"
                                    id="tokenQuantity"
                                    value={tokenQuantity}
                                    onChange={(e) => setTokenQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    min="0.000001" // 示例最小值
                                    step="any" // 允许小数
                                    required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.modalButton}>Lock!</button>
                                <button type="button" className={styles.modalButton} onClick={handleCloseModal}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}