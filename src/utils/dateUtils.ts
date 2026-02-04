import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    startOfYear,
    endOfYear,
    isToday,
    isYesterday,
    parseISO
} from 'date-fns';

// Format date for display
export const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);

    if (isToday(date)) {
        return 'Today';
    }
    if (isYesterday(date)) {
        return 'Yesterday';
    }

    return format(date, 'dd MMM');
};

export const formatFullDate = (timestamp: number): string => {
    return format(new Date(timestamp), 'dd MMM yyyy');
};

export const formatDateForInput = (timestamp: number): string => {
    return format(new Date(timestamp), 'yyyy-MM-dd');
};

export const parseDateFromInput = (dateString: string): number => {
    return parseISO(dateString).getTime();
};

// Get date ranges
export const getMonthRange = (date: Date = new Date()): { start: number; end: number } => {
    return {
        start: startOfMonth(date).getTime(),
        end: endOfMonth(date).getTime()
    };
};

export const getWeekRange = (date: Date = new Date()): { start: number; end: number } => {
    return {
        start: startOfWeek(date, { weekStartsOn: 1 }).getTime(),
        end: endOfWeek(date, { weekStartsOn: 1 }).getTime()
    };
};

export const getYearRange = (date: Date = new Date()): { start: number; end: number } => {
    return {
        start: startOfYear(date).getTime(),
        end: endOfYear(date).getTime()
    };
};

// Get current day of month
export const getDayOfMonth = (): number => {
    return new Date().getDate();
};

// Get days in current month
export const getDaysInMonth = (): number => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// Format time ago
export const timeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return formatDate(timestamp);
};

// Get month name
export const getMonthName = (monthIndex: number): string => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
};
