import { motion } from 'framer-motion';

interface RadialChartProps {
    value: number;       // 0-100
    label: string;
    size?: number;       // px, default 100
    strokeWidth?: number;
    colorFrom?: string;  // gradient start
    colorTo?: string;    // gradient end
    delay?: number;      // animation delay in seconds
}

export default function RadialChart({
    value,
    label,
    size = 100,
    strokeWidth = 8,
    colorFrom = '#d5a84b',
    colorTo = '#cc8e2d',
    delay = 0,
}: RadialChartProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    const gradientId = `radial-grad-${label.replace(/\s/g, '-')}`;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    className="transform -rotate-90"
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colorFrom} />
                            <stop offset="100%" stopColor={colorTo} />
                        </linearGradient>
                    </defs>
                    {/* Background track */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        className="text-gray-200 dark:text-white/10"
                        strokeWidth={strokeWidth}
                    />
                    {/* Animated progress arc */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={`url(#${gradientId})`}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{
                            duration: 1.4,
                            delay,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    />
                </svg>
                {/* Center value */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: delay + 0.8 }}
                >
                    <span className="text-xl font-bold text-sacred-dark dark:text-pearl-50 tabular-nums">
                        {value}
                        <span className="text-xs text-gray-400 dark:text-gray-500">%</span>
                    </span>
                </motion.div>
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center leading-tight">
                {label}
            </span>
        </div>
    );
}
