import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProfile } from "../features/auth/authSlice";
import { RenewalPopup } from "../components/RenewalPopup";
import { BaseLoading } from "../components/BaseLoading";

interface SubscriptionGuardProps {
    children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
    const dispatch = useDispatch();
    const { profile } = useSelector((state: any) => state.auth);
    const token = localStorage.getItem("token");
    const [checked, setChecked] = useState(false);

    // Fetch profile if token exists
    useEffect(() => {
        if (token) {
            dispatch(getProfile(token))
                .finally(() => setChecked(true));
        } else {
            setChecked(true);
        }
    }, [dispatch, token]);

    const calculateDaysLeft = () => {
        if (profile?.activePackage?.endDate) {
            const end = new Date(profile.activePackage.endDate);
            const now = new Date();
            if (!isNaN(end.getTime())) {
                const diffTime = Math.max(end.getTime() - now.getTime(), 0);
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }
        return null;
    };

    const daysLeft = calculateDaysLeft();

    // Show blocking dialog if no package, status is 0, or daysLeft is 0
    const isExpired = profile?.activePackage === null || profile?.activePackage?.status === 0 || (daysLeft !== null && daysLeft <= 0);

    // While checking/loading, render a loader instead of children
    if (!checked) return <BaseLoading message="Checking subscription..." />;

    return (
        <>
            {children}

            {isExpired && (
                <RenewalPopup
                    plan={profile?.activePackage}
                    isOpen={true}
                    onOpenChange={() => { }}
                />
            )}
        </>
    );
}
