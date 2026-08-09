import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

import type { ReactNode } from 'react';

export const StatCard = ({ label, value, subtext, color = "blue", icon }: { label: string, value: string, subtext?: string, color?: "blue" | "green" | "amber" | "indigo" | "emerald", icon?: ReactNode }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        green: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
        amber: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
    };

    return (
        <div className={cn("p-6 rounded-xl border relative overflow-hidden", colors[color])}>
            <div className="flex justify-between items-start">
                <div className="relative z-10">
                    <div className="text-sm font-medium opacity-80 mb-1">{label}</div>
                    <div className="text-3xl font-bold tracking-tight">{value}</div>
                    {subtext && <div className="text-xs mt-2 opacity-70 font-medium">{subtext}</div>}
                </div>
                {icon && (
                    <div className="p-2 bg-white/50 dark:bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 dark:border-white/10">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};
