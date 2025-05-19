'use client'; // 需要 'use client' 因为我们使用了 useState 和事件处理

import React, { useState, FormEvent } from 'react';
import styles from './registrar.module.css';
import Link from 'next/link';

interface LockModule {
    slug: string;
    title: string;
    description: string;
    lockCount: string;
    large?: boolean;
}

const initialModules: LockModule[] = [
    { slug: 'travel-fund', title: '存钱去旅游', description: 'discription', lockCount: '21locks' },
    { slug: 'education-fund', title: '存钱去深造', description: 'discription', lockCount: '10locks' },
    { slug: 'startup-fund', title: '存钱去创业', description: 'discription', lockCount: '5locks' },
    { slug: 'sui-foundation', title: 'sui foundation', description: 'discription', lockCount: '5locks' },
    { slug: 'suilend-foundation', title: 'suilend foundation', description: 'discription', lockCount: '6locks', large: true },
];

export default function RegistrarPage() {
    const [modules, setModules] = useState<LockModule[]>(initialModules);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newModuleName, setNewModuleName] = useState('');
    const [newModuleDescription, setNewModuleDescription] = useState('');

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewModuleName('');
        setNewModuleDescription('');
    };

    const handleSubmitNewModule = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!newModuleName.trim()) {
            alert('模块名称不能为空');
            return;
        }
        const slug = newModuleName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        const newModule: LockModule = {
            slug: slug || `module-${Date.now()}`, // 确保 slug 不为空
            title: newModuleName,
            description: newModuleDescription,
            lockCount: '0locks', // 新模块初始 lock 数量为 0
        };
        setModules([...modules, newModule]);
        handleCloseModal();
    };

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <h1 className={styles.title}>StillFlow</h1>
                <p className={styles.welcomeText}>welcome to StillFlow</p>
                <div className={styles.actionsContainer}>
                    <button className={styles.actionButton} onClick={handleOpenModal}>
                        + create new
                    </button>
                </div>
                <div className={styles.locksGrid}>
                    {modules.map((module) => (
                        <Link href={`/lock/${module.slug}`} passHref className={styles.lockItemLink} key={module.slug}>
                            <div className={`${styles.lockItem} ${module.large ? styles.largeLockItem : ''}`}>
                                <p className={styles.lockTitle}>{module.title}</p>
                                <p className={styles.lockDescription}>{module.description}</p>
                                <p className={styles.lockCount}>{module.lockCount}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>创建新模块</h2>
                        <form onSubmit={handleSubmitNewModule}>
                            <div className={styles.formGroup}>
                                <label htmlFor="moduleName">模块名称:</label>
                                <input
                                    type="text"
                                    id="moduleName"
                                    value={newModuleName}
                                    onChange={(e) => setNewModuleName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="moduleDescription">模块描述:</label>
                                <textarea
                                    id="moduleDescription"
                                    value={newModuleDescription}
                                    onChange={(e) => setNewModuleDescription(e.target.value)}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.modalButton}>创建</button>
                                <button type="button" className={styles.modalButton} onClick={handleCloseModal}>取消</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}