// Currency formatting utilities

const currencyConfig: Record<string, { locale: string; symbol: string }> = {
    INR: { locale: 'en-IN', symbol: '₹' },
    USD: { locale: 'en-US', symbol: '$' },
    EUR: { locale: 'de-DE', symbol: '€' },
    GBP: { locale: 'en-GB', symbol: '£' },
    JPY: { locale: 'ja-JP', symbol: '¥' }
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    const config = currencyConfig[currency] || currencyConfig.INR;

    return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
        minimumFractionDigits: 0
    }).format(amount);
};

export const formatCompactCurrency = (amount: number, currency: string = 'INR'): string => {
    const config = currencyConfig[currency] || currencyConfig.INR;

    if (amount >= 10000000) {
        return `${config.symbol}${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
        return `${config.symbol}${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
        return `${config.symbol}${(amount / 1000).toFixed(1)}K`;
    }

    return formatCurrency(amount, currency);
};

export const getCurrencySymbol = (currency: string = 'INR'): string => {
    return currencyConfig[currency]?.symbol || '₹';
};

export const supportedCurrencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' }
];
