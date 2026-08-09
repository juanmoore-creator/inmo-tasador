import React from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

export const Card = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn("bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300", className)}
        {...props}
    >
        {children}
    </div>
);
