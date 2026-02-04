import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { CategoryType } from '../types';
import { ArrowLeft, Check, Wallet } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const categoryIcons = [
    'utensils', 'car', 'shopping-bag', 'film', 'heart-pulse', 'receipt',
    'graduation-cap', 'shopping-cart', 'sparkles', 'more-horizontal',
    'briefcase', 'laptop', 'gift', 'trending-up', 'rotate-ccw',
    'home', 'plane', 'gamepad-2', 'dumbbell', 'music', 'coffee', 'book'
];

const categoryColors = [
    '#E57373', '#64B5F6', '#BA68C8', '#FFB74D', '#81C784', '#90A4AE',
    '#4DB6AC', '#78909C', '#4CAF50', '#7986CB', '#F06292', '#9575CD',
    '#FF6B35', '#00BCD4', '#8BC34A', '#FFC107'
];

export const AddEditCategory = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isEditMode = !!id;

    const { user } = useAuthStore();
    const { categories, loadCategories, addCategory, updateCategory } = useCategoryStore();

    const [name, setName] = useState('');
    const [type, setType] = useState<CategoryType>(CategoryType.EXPENSE);
    const [icon, setIcon] = useState('shopping-bag');
    const [color, setColor] = useState('#E57373');
    const [budget, setBudget] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            loadCategories(user.uid);
        }
    }, [user]);

    // Set type from URL param
    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam === 'income') {
            setType(CategoryType.INCOME);
        }
    }, [searchParams]);

    // Load existing category in edit mode
    useEffect(() => {
        if (isEditMode && categories.length > 0) {
            const category = categories.find(c => c.id === id);
            if (category) {
                setName(category.name);
                setType(category.type);
                setIcon(category.icon);
                setColor(category.color);
                setBudget(category.budget?.toString() || '');
            }
        }
    }, [isEditMode, id, categories]);

    // Get icon component
    const getIcon = (iconName: string, size: number = 20) => {
        const iconKey = iconName
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('') as keyof typeof LucideIcons;

        const IconComponent = LucideIcons[iconKey] as React.ComponentType<{ size: number }>;
        return IconComponent ? <IconComponent size={size} /> : <Wallet size={size} />;
    };

    const handleSave = async () => {
        if (!user) return;

        if (!name.trim()) {
            setError('Please enter a category name');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const budgetNum = budget ? parseFloat(budget) : undefined;

            if (isEditMode) {
                await updateCategory(user.uid, id!, { name, type, icon, color, budget: budgetNum });
            } else {
                await addCategory(user.uid, {
                    name,
                    type,
                    icon,
                    color,
                    budget: budgetNum,
                    isDefault: false,
                    createdAt: Date.now()
                });
            }
            navigate(-1);
        } catch (err: any) {
            setError(err.message || 'Failed to save category');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header flex items-center gap-4">
                    <button className="btn btn-icon btn-secondary" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="page-title">{isEditMode ? 'Edit' : 'Add'} Category</h1>
                </div>

                {/* Preview */}
                <div className="section">
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center"
                            style={{ background: color + '20', color: color }}
                        >
                            {getIcon(icon, 40)}
                        </div>
                    </div>
                </div>

                {/* Name */}
                <div className="section">
                    <h2 className="section-title">Name</h2>
                    <input
                        type="text"
                        className="input"
                        placeholder="Category name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Type */}
                <div className="section">
                    <h2 className="section-title">Type</h2>
                    <div className="tabs">
                        <button
                            className={`tab ${type === CategoryType.EXPENSE ? 'active' : ''}`}
                            onClick={() => setType(CategoryType.EXPENSE)}
                        >
                            Expense
                        </button>
                        <button
                            className={`tab ${type === CategoryType.INCOME ? 'active' : ''}`}
                            onClick={() => setType(CategoryType.INCOME)}
                        >
                            Income
                        </button>
                    </div>
                </div>

                {/* Icon */}
                <div className="section">
                    <h2 className="section-title">Icon</h2>
                    <div className="grid grid-cols-6 gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {categoryIcons.map(iconName => (
                            <button
                                key={iconName}
                                className="p-3 rounded-lg flex items-center justify-center transition-all"
                                style={{
                                    background: icon === iconName ? color : 'var(--color-surface)',
                                    border: `1px solid ${icon === iconName ? color : 'var(--color-border)'}`,
                                    color: icon === iconName ? 'white' : 'var(--color-text-primary)'
                                }}
                                onClick={() => setIcon(iconName)}
                            >
                                {getIcon(iconName, 20)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color */}
                <div className="section">
                    <h2 className="section-title">Color</h2>
                    <div className="grid grid-cols-8 gap-2">
                        {categoryColors.map(c => (
                            <button
                                key={c}
                                className="w-10 h-10 rounded-lg transition-all"
                                style={{
                                    background: c,
                                    border: color === c ? '3px solid var(--color-text-primary)' : 'none',
                                    transform: color === c ? 'scale(1.1)' : 'scale(1)'
                                }}
                                onClick={() => setColor(c)}
                            />
                        ))}
                    </div>
                </div>

                {/* Budget (for expense categories) */}
                {type === CategoryType.EXPENSE && (
                    <div className="section">
                        <h2 className="section-title">Monthly Budget (Optional)</h2>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-secondary">₹</span>
                            <input
                                type="number"
                                className="input"
                                style={{ paddingLeft: '36px' }}
                                placeholder="0"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>
                        <p className="text-sm text-secondary mt-2">
                            Set a spending limit to track your budget
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-lg mb-4" style={{ background: 'var(--color-error-bg)' }}>
                        <p className="text-sm text-error">{error}</p>
                    </div>
                )}

                {/* Save Button */}
                <button
                    className="btn btn-primary btn-full"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="spinner" style={{ width: '20px', height: '20px' }} />
                    ) : (
                        <>
                            <Check size={20} />
                            {isEditMode ? 'Update' : 'Create'} Category
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
