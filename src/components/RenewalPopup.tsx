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
import { Phone, Mail, Zap, Calendar, MessageSquare, FileText, Clock, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RenewalPopupProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    plan?: any;
}

export const RenewalPopup: React.FC<RenewalPopupProps> = ({ isOpen, onOpenChange, trigger, plan }) => {
    const calculateDaysLeft = () => {
        // check if plan.daysUntilRenewal is a valid number
        if (plan?.daysUntilRenewal !== null && plan?.daysUntilRenewal !== undefined && plan?.daysUntilRenewal !== "") {
            const days = Number(plan.daysUntilRenewal);
            if (!isNaN(days)) return days;
        }

        // fallback to calculation using endDate
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

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                <div className="bg-primary/5 p-6 border-b border-primary/10">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <Zap className="w-6 h-6 text-primary fill-primary/20" />
                            {plan?.packageName || "Small Business"} Plan Renewal
                        </DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {plan?.packageDesc || "15K Contacts 35K Messages 5 Templates Manual & Auto Schedule Analytics & Reports Free Support"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 rounded-xl">
                            <Calendar className="w-5 h-5 text-blue-500 mb-2" />
                            <span className="text-xs text-muted-foreground font-medium">Duration</span>
                            <span className="font-bold">{plan?.day || 365} days</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 bg-indigo-50/50 rounded-xl">
                            <MessageSquare className="w-5 h-5 text-indigo-500 mb-2" />
                            <span className="text-xs text-muted-foreground font-medium">Messages</span>
                            <span className="font-bold">{(plan?.msgCount || 35000).toLocaleString()}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 bg-green-50/50 rounded-xl">
                            <FileText className="w-5 h-5 text-green-500 mb-2" />
                            <span className="text-xs text-muted-foreground font-medium">Templates</span>
                            <span className="font-bold">{plan?.templateCount || 10}</span>
                        </div>

                        <div className="flex flex-col items-center justify-center p-3 bg-orange-50/50 rounded-xl">
                            <Clock className="w-5 h-5 text-orange-500 mb-2" />
                            <span className="text-xs text-muted-foreground font-medium">Days Left</span>
                            <span className="font-bold">{daysLeft}</span>
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 text-sm">
                            <div><span className="font-semibold text-muted-foreground">Start:</span> {plan?.startDate ? new Date(plan.startDate).toLocaleDateString() : 'N/A'}</div>
                            <div><span className="font-semibold text-muted-foreground">End:</span> {plan?.endDate ? new Date(plan.endDate).toLocaleDateString() : 'N/A'}</div>
                        </div>
                        <Badge variant="outline" className={`px-3 py-1 ${daysLeft > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {daysLeft} days remaining
                        </Badge>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-border">
                        <h4 className="font-medium text-sm text-muted-foreground">For renewal assistance, please contact:</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="mailto:info@fableadtechnolabs.com" className="flex items-center gap-3 text-sm flex-1 bg-secondary/30 p-3 rounded-lg border border-secondary hover:bg-secondary/50 transition-colors">
                                <Mail className="w-5 h-5 text-primary" />
                                <span className="font-medium text-xs sm:text-sm break-all">info@fableadtechnolabs.com</span>
                            </a>
                            <a href="tel:+919824734531" className="flex items-center gap-3 text-sm flex-1 bg-secondary/30 p-3 rounded-lg border border-secondary hover:bg-secondary/50 transition-colors">
                                <Phone className="w-5 h-5 text-primary" />
                                <span className="font-medium">+91 9824734531</span>
                            </a>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-muted/50 p-4 border-t border-border sm:justify-end items-center">
                    <Button variant="ghost" onClick={() => onOpenChange?.(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
