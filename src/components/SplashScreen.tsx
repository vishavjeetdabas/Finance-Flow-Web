import { Wallet } from 'lucide-react';

export const SplashScreen = () => {
    return (
        <div className="splash-screen" id="splash-screen">
            <div className="splash-logo">
                <Wallet size={40} />
            </div>
            <p className="splash-text">FinanceFlow</p>
        </div>
    );
};
