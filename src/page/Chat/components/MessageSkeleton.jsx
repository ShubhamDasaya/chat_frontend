import React from "react";

const MessageSkeleton = () => (
    <div className="flex flex-col gap-6 py-4 px-2 w-full animate-pulse">
        <div className="flex gap-3 items-start max-w-[70%]">
            <div className="w-8 h-8 rounded-full bg-[var(--hover-bg-strong)] shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
                <div className="h-3 w-24 bg-[var(--hover-bg-strong)] rounded" />
                <div className="h-10 w-48 bg-[var(--hover-bg)] rounded-2xl" />
            </div>
        </div>
        <div className="flex gap-3 items-start max-w-[70%] self-end flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-[var(--hover-bg-strong)] shrink-0" />
            <div className="flex flex-col gap-2 flex-1 items-end">
                <div className="h-3 w-16 bg-[var(--hover-bg-strong)] rounded" />
                <div className="h-12 w-64 bg-[var(--hover-bg)] rounded-2xl" />
            </div>
        </div>
        <div className="flex gap-3 items-start max-w-[60%]">
            <div className="w-8 h-8 rounded-full bg-[var(--hover-bg-strong)] shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
                <div className="h-3 w-20 bg-[var(--hover-bg-strong)] rounded" />
                <div className="h-8 w-36 bg-[var(--hover-bg)] rounded-2xl" />
            </div>
        </div>
    </div>
);

export default MessageSkeleton;
