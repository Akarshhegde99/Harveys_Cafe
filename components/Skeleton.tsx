import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => {
    return (
        <div
            className={`animate-pulse bg-white/10 rounded-lg ${className}`}
        />
    );
};

export const CardSkeleton = () => {
    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 h-[380px] flex flex-col">
            <Skeleton className="w-full h-48 mb-4" />
            <Skeleton className="w-3/4 h-6 mb-2" />
            <Skeleton className="w-1/2 h-4 mb-4" />
            <div className="mt-auto flex justify-between items-center">
                <Skeleton className="w-20 h-8" />
                <Skeleton className="w-24 h-10 rounded-lg" />
            </div>
        </div>
    );
};

export const CategorySkeleton = () => {
    return (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col items-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="w-20 h-6" />
        </div>
    );
};

export const ListSkeleton = () => {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2 w-1/3">
                            <Skeleton className="h-6 w-full bg-gray-200" />
                            <Skeleton className="h-4 w-1/2 bg-gray-200" />
                        </div>
                        <Skeleton className="h-6 w-24 rounded-full bg-gray-200" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-4 w-32 bg-gray-200" />
                        <Skeleton className="h-4 w-32 bg-gray-200" />
                    </div>
                </div>
            ))}
        </div>
    );
};
