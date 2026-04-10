import { motion } from 'framer-motion';
import { X, SlidersHorizontal, Check, MapPin, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export interface AdvancedFilters {
    ageRange: number[];
    location: string;
    rite: string;
    maritalStatus: string;
    education: string;
    diet: string;
    motherTongue: string;
    smoke: string; // 'any' | 'no' | 'yes'
    drink: string; // 'any' | 'no' | 'yes'
}

interface AdvancedFiltersModalProps {
    onClose: () => void;
    initialFilters: AdvancedFilters;
    onApplyFilters: (filters: AdvancedFilters) => void;
}

const RITE_OPTIONS = ['Any', 'Syro-Malabar', 'Latin', 'Knanaya Catholic', 'Malankara Orthodox', 'Syro-Malankara', 'Other'];
const MARITAL_OPTIONS = ['Any', 'Never Married', 'Annulled', 'Widowed'];
const EDUCATION_OPTIONS = ['Any', 'Bachelors', 'Masters', 'Doctorate', 'Professional Degree'];
const DIET_OPTIONS = ['Any', 'Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Pescatarian'];
const TONGUE_OPTIONS = ['Any', 'Malayalam', 'Konkani', 'Tamil', 'English', 'Hindi', 'Kannada', 'Other'];

const DEFAULT_FILTERS: AdvancedFilters = {
    ageRange: [18, 60],
    location: '',
    rite: 'Any',
    maritalStatus: 'Any',
    education: 'Any',
    diet: 'Any',
    motherTongue: 'Any',
    smoke: 'any',
    drink: 'any',
};

function ChipGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
    return (
        <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{label}</h3>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                            value === opt
                                ? 'border-gold-500 bg-gold-50 text-gold-800 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gold-300 hover:text-sacred-dark'
                        }`}
                    >
                        {value === opt && <Check className="h-3 w-3 text-gold-600" />}
                        {opt}
                    </button>
                ))}
            </div>
        </section>
    );
}

function LifestyleToggle({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
                {(['any', 'no', 'yes'] as const).map(opt => (
                    <button
                        key={opt}
                        onClick={() => onChange(opt)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all duration-200 ${
                            value === opt
                                ? 'bg-white text-sacred-dark shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {opt === 'any' ? 'Any' : opt === 'no' ? 'No' : 'Yes'}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function AdvancedFiltersModal({ onClose, initialFilters, onApplyFilters }: AdvancedFiltersModalProps) {
    const [filters, setFilters] = useState<AdvancedFilters>(initialFilters);

    const set = <K extends keyof AdvancedFilters>(key: K, val: AdvancedFilters[K]) =>
        setFilters(prev => ({ ...prev, [key]: val }));

    const activeCount = [
        filters.ageRange[0] !== 18 || filters.ageRange[1] !== 60,
        !!filters.location,
        filters.rite !== 'Any',
        filters.maritalStatus !== 'Any',
        filters.education !== 'Any',
        filters.diet !== 'Any',
        filters.motherTongue !== 'Any',
        filters.smoke !== 'any',
        filters.drink !== 'any',
    ].filter(Boolean).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-start bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="flex h-full w-full max-w-sm flex-col bg-white shadow-2xl border-r border-gold-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gold-100 bg-white px-6 py-5 shrink-0">
                    <div className="flex items-center gap-3">
                        <SlidersHorizontal className="h-5 w-5 text-gold-600" />
                        <h2 className="font-serif text-xl text-sacred-dark">Advanced Filters</h2>
                        {activeCount > 0 && (
                            <span className="rounded-full bg-gold-600 px-2 py-0.5 text-xs font-bold text-white">
                                {activeCount}
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-sacred-dark transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Filters */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Age Range */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Age Range</h3>
                        <div className="flex items-center justify-between mb-3 text-sm font-semibold text-sacred-dark">
                            <span className="bg-gold-50 border border-gold-200 rounded-lg px-3 py-1">{filters.ageRange[0]} yrs</span>
                            <span className="text-gray-400 text-xs">to</span>
                            <span className="bg-gold-50 border border-gold-200 rounded-lg px-3 py-1">{filters.ageRange[1]} yrs</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Min age</label>
                                <input
                                    type="range" min="18" max="60" value={filters.ageRange[0]}
                                    onChange={e => set('ageRange', [Math.min(parseInt(e.target.value), filters.ageRange[1] - 1), filters.ageRange[1]])}
                                    className="w-full accent-gold-600 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Max age</label>
                                <input
                                    type="range" min="18" max="60" value={filters.ageRange[1]}
                                    onChange={e => set('ageRange', [filters.ageRange[0], Math.max(parseInt(e.target.value), filters.ageRange[0] + 1)])}
                                    className="w-full accent-gold-600 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Location */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Location</h3>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="City, State, or Country..."
                                value={filters.location}
                                onChange={e => set('location', e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-sacred-dark outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 transition-all"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Matches any profile location containing this text</p>
                    </section>

                    {/* Church Rite */}
                    <ChipGroup label="Church Rite" options={RITE_OPTIONS} value={filters.rite} onChange={v => set('rite', v)} />

                    {/* Marital Status */}
                    <ChipGroup label="Marital Status" options={MARITAL_OPTIONS} value={filters.maritalStatus} onChange={v => set('maritalStatus', v)} />

                    {/* Education */}
                    <ChipGroup label="Education" options={EDUCATION_OPTIONS} value={filters.education} onChange={v => set('education', v)} />

                    {/* Dietary Preference */}
                    <ChipGroup label="Dietary Preference" options={DIET_OPTIONS} value={filters.diet} onChange={v => set('diet', v)} />

                    {/* Mother Tongue */}
                    <ChipGroup label="Mother Tongue" options={TONGUE_OPTIONS} value={filters.motherTongue} onChange={v => set('motherTongue', v)} />

                    {/* Lifestyle */}
                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Lifestyle</h3>
                        <div className="space-y-4 bg-gray-50 rounded-2xl p-4">
                            <LifestyleToggle label="Smokes" value={filters.smoke} onChange={v => set('smoke', v)} />
                            <div className="h-px bg-gray-200" />
                            <LifestyleToggle label="Drinks Alcohol" value={filters.drink} onChange={v => set('drink', v)} />
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-5 bg-white shrink-0 space-y-3">
                    <button
                        onClick={() => { onApplyFilters(filters); onClose(); }}
                        className="w-full rounded-2xl bg-gradient-to-r from-gold-600 to-gold-500 py-3.5 font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-gold-200/60"
                    >
                        Apply {activeCount > 0 ? `${activeCount} Filter${activeCount > 1 ? 's' : ''}` : 'Filters'}
                    </button>
                    <button
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 font-medium text-gray-500 hover:text-sacred-dark transition-colors"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset All
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
