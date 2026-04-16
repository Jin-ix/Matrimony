import { motion } from 'framer-motion';

export default function SkeletonCard() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-[480px] w-full rounded-3xl bg-gray-100 dark:bg-sacred-midnight/40 border border-gray-200 dark:border-white/10 overflow-hidden"
        >
            {/* Shimmer Effect Overlay */}
            <div className="absolute inset-0 z-10 w-full h-full transform -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 w-full p-6 space-y-4">
                <div className="flex items-end justify-between">
                    <div className="space-y-2">
                        {/* Title skeleton */}
                        <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-white/10" />
                        {/* Subtitle skeleton */}
                        <div className="h-4 w-32 rounded-lg bg-gray-200 dark:bg-white/10" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
