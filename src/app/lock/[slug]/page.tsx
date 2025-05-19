'use client'; // 需要 'use client' 因为我们使用了 useState 和事件处理

import React, { useState, FormEvent, use } from 'react'; // 导入 use
import styles from './lock.module.css';
import Link from 'next/link';

// 辅助函数或映射，用于根据 slug 获取标题等信息
const getLockDetails = (slug: string) => {
    const detailsMap: { [key: string]: { title: string; iconText: string } } = {
        'travel-fund': { title: '存钱去旅游', iconText: '旅游' },
        'education-fund': { title: '存钱去深造', iconText: '深造' },
        'startup-fund': { title: '存钱去创业', iconText: '创业' },
        'sui-foundation': { title: 'Sui Foundation', iconText: 'Sui' },
        'suilend-foundation': { title: 'Suilend Foundation', iconText: 'Suilend' },
    };
    // 为动态创建的模块提供默认值
    const dynamicTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return detailsMap[slug] || { title: dynamicTitle || 'Lock Details', iconText: '模块' };
};

interface LockItemData {
    id: string;
    token: string;
    quantity: number;
    expiryDate: string;
    moduleSlug: string; // 记录这个 lock 属于哪个模块
}

// 假设的代币选项
const tokenOptions = [
    { value: 'sui', label: 'SUI' },
    { value: 'usdc', label: 'USDC' },
    { value: 'usdt', label: 'USDT' },
];

export default function LockPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
    const params = use(paramsPromise); // 使用 React.use 解构 params
    const { slug } = params;
    const lockDetails = getLockDetails(slug);

    const [locks, setLocks] = useState<LockItemData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState<string>(tokenOptions[0].value);
    const [tokenQuantity, setTokenQuantity] = useState<number | ''>('');
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [selectedLockDetail, setSelectedLockDetail] = useState<LockItemData | null>(null); // 新增 state

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedToken(tokenOptions[0].value);
        setTokenQuantity('');
        setExpiryDate('');
    };

    const handleSubmitNewLock = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (tokenQuantity === '' || tokenQuantity <= 0) {
            alert('代币数量必须大于0');
            return;
        }
        if (!expiryDate) {
            alert('请选择到期日期');
            return;
        }

        const newLock: LockItemData = {
            id: `lock-${Date.now()}`,
            token: selectedToken,
            quantity: tokenQuantity as number, // 在此断言，因为已经检查过
            expiryDate: expiryDate,
            moduleSlug: slug,
        };

        setLocks([...locks, newLock]);
        handleCloseModal();
    };

    const handleLockItemClick = (lock: LockItemData) => { // 新增点击处理函数
        setSelectedLockDetail(lock);
    };

    // 过滤当前模块的 locks
    const currentModuleLocks = locks.filter(lock => lock.moduleSlug === slug);

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
                                        Lock #{index + 1}: {lock.quantity} {lock.token.toUpperCase()} (Expires: {lock.expiryDate})
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noLocksText}>还没有任何 Locks，点击 "+ Add" 创建一个吧！</p>
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
                                    <p><strong>ID:</strong> {selectedLockDetail.id}</p>
                                    <p><strong>Token:</strong> {selectedLockDetail.token.toUpperCase()}</p>
                                    <p><strong>Quantity:</strong> {selectedLockDetail.quantity}</p>
                                    <p><strong>Expires:</strong> {selectedLockDetail.expiryDate}</p>
                                    {/* <p><strong>Module:</strong> {selectedLockDetail.moduleSlug}</p> */}
                                </>
                            ) : (
                                <p>点击左侧列表中的 Lock 查看详细信息。</p>
                            )}
                        </div>
                        {selectedLockDetail && ( // 仅当有 Lock 被选中时显示操作按钮
                            <div className={styles.financialActions}>
                                <button className={`${styles.button} ${styles.transferButton}`}>transfer</button>
                                <button className={`${styles.button} ${styles.withdrawButton}`}>withdraw</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.backLinkContainer}>
                    <Link href="/registrar" className={styles.backLink}>
                        &larr; Back to Registrar
                    </Link>
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>创建新 Lock for {lockDetails.title}</h2>
                        <form onSubmit={handleSubmitNewLock}>
                            <div className={styles.formGroup}>
                                <label htmlFor="tokenSelect">选择代币:</label>
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
                                <label htmlFor="tokenQuantity">代币数量:</label>
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
                            <div className={styles.formGroup}>
                                <label htmlFor="expiryDate">到期日期:</label>
                                <input
                                    type="date"
                                    id="expiryDate"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.modalButton}>Lock!</button>
                                <button type="button" className={styles.modalButton} onClick={handleCloseModal}>取消</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}