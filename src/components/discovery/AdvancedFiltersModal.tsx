import { motion } from 'framer-motion';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { useState } from 'react';

interface AdvancedFiltersModalProps {
    onClose: () => void;
    initialAgeRange: number[];
    onApplyFilters: (ageRange: number[]) => void;
}

export default function AdvancedFiltersModal({ onClose, initialAgeRange, onApplyFilters }: AdvancedFiltersModalProps) {
    const [ageRange, setAgeRange] = useState(initialAgeRange);
    const [education, setEducation] = useState('Bachelors');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-start bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl border-r border-gold-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gold-200 bg-sacred-offwhite px-6 py-5">
                    <h2 className="font-serif text-2xl text-sacred-dark flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5 text-gold-600" /> Advanced Filters
                    </h2>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gold-50 hover:text-sacred-dark transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white/50">
                    <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Age Range</h3>
                        <div className="flex items-center justify-between mt-2 px-2 text-sacred-dark font-medium">
                            <span>{ageRange[0]} yrs</span>
                            <span>{ageRange[1]} yrs</span>
                        </div>
                        <input
                            type="range"
                            min="18"
                            max="60"
                            value={ageRange[1]}
                            onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                            className="w-full mt-4 accent-gold-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Education</h3>
                        <div className="space-y-2">
                            {['Bachelors', 'Masters', 'Doctorate', 'Professional Degree'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => setEducation(level)}
                                    className={`w-full flex items-center justify-between rounded-xl border p-3 transition-colors ${education === level
                                            ? 'border-gold-400 bg-gold-50 text-gold-800'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gold-300'
                                        }`}
                                >
                                    <span className="font-medium text-sm">{level}</span>
                                    {education === level && <Check className="h-4 w-4 text-gold-600" />}
                                </button>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Dietary Preference</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['Vegetarian', 'Non-Vegetarian', 'Pescatarian', 'Any'].map(diet => (
                                <button key={diet} className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gold-50 hover:border-gold-300 hover:text-gold-800 transition-colors">
                                    {diet}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="border-t border-gold-100 p-6 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    <button onClick={() => { onApplyFilters(ageRange); onClose(); }} className="w-full rounded-2xl bg-gradient-to-r from-gold-600 to-gold-500 py-3.5 font-medium text-white transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-gold-200">
                        Apply Filters
                    </button>
                    <button onClick={() => setAgeRange([18, 60])} className="w-full mt-3 rounded-2xl py-2 font-medium text-gray-500 hover:text-sacred-dark transition-colors">
                        Reset All
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
