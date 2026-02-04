import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useTransactionStore } from '../stores/transactionStore';
import { NavBar } from '../components/layout/NavBar';
import { CategoryType, Category } from '../types';
import { Plus, Trash2, Edit2, Wallet, AlertTriangle, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const Categories = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { categories, loadCategories, deleteCategory } = useCategoryStore();
    const { transactions, loadTransactions } = useTransactionStore();
    const [selectedTab, setSelectedTab] = useState<'expense' | 'income'>('expense');
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [transactionsUsingCategory, setTransactionsUsingCategory] = useState(0);

    useEffect(() => {
        if (user) {
            loadCategories(user.uid);
            loadTransactions(user.uid);
        }
    }, [user]);

    const filteredCategories = categories.filter(c =>
        c.type === (selectedTab === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME)
    );

    // Get icon component
    const getIcon = (iconName: string, size: number = 20) => {
        const iconKey = iconName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') as keyof typeof LucideIcons;

        const IconComponent = LucideIcons[iconKey] as React.ComponentType<{ size: number }>;
        return IconComponent ? <IconComponent size={size} /> : <Wallet size={size} />;
    };

    const handleDeleteClick = (category: Category, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        // Check if category is in use
        const usageCount = transactions.filter(t => t.categoryId === category.id).length;
        setTransactionsUsingCategory(usageCount);
        setCategoryToDelete(category);
    };

    const confirmDelete = async () => {
        if (!user || !categoryToDelete) return;

        try {
            await deleteCategory(user.uid, categoryToDelete.id);
            setCategoryToDelete(null);
        } catch (err) {
            console.error('Failed to delete category:', err);
        }
    };

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header flex justify-between items-center">
                    <h1 className="page-title">Categories</h1>
                    <button
                        className="btn btn-primary btn-icon"
                        onClick={() => navigate(`/add-category?type=${selectedTab}`)}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="tabs mb-6">
                    <button
                        className={`tab ${selectedTab === 'expense' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('expense')}
                    >
                        Expense
                    </button>
                    <button
                        className={`tab ${selectedTab === 'income' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('income')}
                    >
                        Income
                    </button>
                </div>

                {/* Category List */}
                {filteredCategories.length === 0 ? (
                    <div className="empty-state">
                        <Wallet className="empty-state-icon" />
                        <p className="empty-state-title">No categories</p>
                        <p className="empty-state-text">Add your first {selectedTab} category</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredCategories.map(category => (
                            <div
                                key={category.id}
                                className="card flex items-center gap-3"
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: category.color + '20', color: category.color }}
                                >
                                    {getIcon(category.icon, 24)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{category.name}</p>
                                    {category.budget && (
                                        <p className="text-sm text-secondary">
                                            Budget: ₹{category.budget.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-icon btn-secondary"
                                        onClick={() => navigate(`/edit-category/${category.id}`)}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {!category.isDefault && (
                                        <button
                                            className="btn btn-icon btn-secondary"
                                            onClick={(e) => handleDeleteClick(category, e)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {categoryToDelete && (
                <div className="modal-overlay" onClick={() => setCategoryToDelete(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div
                                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                style={{ background: transactionsUsingCategory > 0 ? 'var(--color-warning)' : 'var(--color-error-bg)' }}
                            >
                                <AlertTriangle size={32} className={transactionsUsingCategory > 0 ? 'text-white' : 'text-error'} />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Delete Category?</h2>

                            {transactionsUsingCategory > 0 ? (
                                <p className="text-secondary mb-6">
                                    <span className="text-warning font-semibold">Warning:</span> This category is used in{' '}
                                    <strong>{transactionsUsingCategory}</strong> transaction{transactionsUsingCategory > 1 ? 's' : ''}.
                                    Deleting it will remove the category association from those transactions.
                                </p>
                            ) : (
                                <p className="text-secondary mb-6">
                                    Are you sure you want to delete "{categoryToDelete.name}"? This action cannot be undone.
                                </p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    className="btn btn-secondary flex-1"
                                    onClick={() => setCategoryToDelete(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-danger flex-1"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <NavBar />
        </div>
    );
};
