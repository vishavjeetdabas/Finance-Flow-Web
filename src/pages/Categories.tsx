import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { NavBar } from '../components/layout/NavBar';
import { CategoryType } from '../types';
import { Plus, Trash2, Edit2, Wallet } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const Categories = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { categories, loadCategories, deleteCategory } = useCategoryStore();
    const [selectedTab, setSelectedTab] = useState<'expense' | 'income'>('expense');

    useEffect(() => {
        if (user) {
            loadCategories(user.uid);
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

    const handleDelete = async (categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await deleteCategory(user.uid, categoryId);
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
                                            onClick={(e) => handleDelete(category.id, e)}
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

            <NavBar />
        </div>
    );
};
