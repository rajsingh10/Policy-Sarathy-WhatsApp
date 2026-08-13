import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Zap, Calendar, MessageSquare, FileText, Clock, ShoppingCart, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

interface RenewalPopupProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    plan?: any;
}

export const RenewalPopup: React.FC<RenewalPopupProps> = ({ isOpen, onOpenChange, trigger, plan }) => {
    const calculateDaysLeft = () => {
        if (plan?.endDate) {
            const end = new Date(plan.endDate);
            const now = new Date();
            if (!isNaN(end.getTime())) {
                const diffTime = Math.max(end.getTime() - now.getTime(), 0);
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }
        return 0;
    };

    const daysLeft = calculateDaysLeft();
    // const daysLeft = -5;

    const dispatch = useDispatch();
    const navigate = useNavigate();


    const handleOpenChange = (open: boolean) => {
        if (daysLeft <= 0 && !open) {
            return;
        }
        onOpenChange?.(open);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className={`w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 ${daysLeft <= 0 ? '[&>button]:hidden' : ''}`}>
                <div className="bg-primary/5 p-3 sm:p-6 border-b border-primary/10">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-2xl font-bold flex items-start sm:items-center gap-2">
                            <Zap className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5 sm:mt-0 ${daysLeft > 0 ? 'text-primary fill-primary/20' : 'text-red-500 fill-red-500/20'}`} />
                            {plan?.packageName || "Small Business"} {daysLeft > 0 ? "Plan Renewal" : "Plan Expired"}
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base mt-1 sm:mt-2">
                            {daysLeft <= 0 && <strong className="text-red-500 block mb-1 sm:mb-2 text-xs sm:text-base">Your subscription has expired. Please renew to continue using the services.</strong>}
                            <span className="hidden sm:block">{plan?.packageDesc || "15K Contacts 35K Messages 5 Templates Manual & Auto Schedule Analytics & Reports Free Support"}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-blue-50/50 rounded-xl">
                            <Calendar className="w-5 h-5 text-blue-500 mb-1 sm:mb-2" />
                            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Duration</span>
                            <span className="text-base sm:text-lg font-bold">{plan?.day || 365} days</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-indigo-50/50 rounded-xl">
                            <MessageSquare className="w-5 h-5 text-indigo-500 mb-1 sm:mb-2" />
                            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Messages</span>
                            <span className="text-base sm:text-lg font-bold">{(plan?.msgCount || 35000).toLocaleString()}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-green-50/50 rounded-xl">
                            <FileText className="w-5 h-5 text-green-500 mb-1 sm:mb-2" />
                            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Templates</span>
                            <span className="text-base sm:text-lg font-bold">{plan?.templateCount || 10}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-orange-50/50 rounded-xl">
                            <Clock className="w-5 h-5 text-orange-500 mb-1 sm:mb-2" />
                            <span className="text-xs sm:text-sm text-muted-foreground font-medium">Days Left</span>
                            <span className="text-base sm:text-lg font-bold">{daysLeft > 0 ? daysLeft : 0}</span>
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-1 sm:gap-y-2 text-sm sm:text-base">
                            <div><span className="font-semibold text-muted-foreground">Start:</span> {plan?.startDate ? new Date(plan.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'N/A'}</div>
                            <div><span className="font-semibold text-muted-foreground">End:</span> {plan?.endDate ? new Date(plan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'N/A'}</div>
                        </div>
                        <Badge variant="outline" className={`px-3 py-1 text-xs sm:text-sm whitespace-nowrap ${daysLeft > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {daysLeft > 0 ? `${daysLeft} days remaining` : 'Plan Expired'}
                        </Badge>
                    </div>

                    <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-border">
                        <h4 className="font-medium text-sm sm:text-base text-muted-foreground">For renewal assistance, please contact:</h4>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <a href="mailto:info@fableadtechnolabs.com" className="flex items-center gap-2 sm:gap-3 text-sm flex-1 bg-secondary/30 p-2.5 sm:p-3 rounded-lg border border-secondary hover:bg-secondary/50 transition-colors">
                                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                                <span className="font-medium text-xs sm:text-sm break-all">info@fableadtechnolabs.com</span>
                            </a>
                            <a href="tel:+919824734531" className="flex items-center gap-2 sm:gap-3 text-sm flex-1 bg-secondary/30 p-2.5 sm:p-3 rounded-lg border border-secondary hover:bg-secondary/50 transition-colors">
                                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                                <span className="font-medium text-xs sm:text-sm">+91 9824734531</span>
                            </a>
                        </div>
                    </div>
                </div>


            </DialogContent>
        </Dialog>
    );
};
