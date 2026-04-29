import { SlidersHorizontal, Church } from 'lucide-react';

interface FilterControlBarProps {
    orthodoxBridge: boolean;
    setOrthodoxBridge: (val: boolean) => void;
    strictKnanaya: boolean;
    setStrictKnanaya: (val: boolean) => void;
    activeRite: string | null;
    setActiveRite: (val: string | null) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    onAdvancedFiltersClick?: () => void;
}

export default function FilterControlBar({
    orthodoxBridge: _orthodoxBridge,
    setOrthodoxBridge: _setOrthodoxBridge,
    strictKnanaya: _strictKnanaya,
    setStrictKnanaya: _setStrictKnanaya,
    activeRite,
    setActiveRite,
    searchQuery,
    setSearchQuery,
    onAdvancedFiltersClick
}: FilterControlBarProps) {

    return (
        <div className="sticky top-[73px] z-30 w-full border-b border-gold-200 bg-white/95 px-6 py-3 backdrop-blur-xl shadow-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-between">

                {/* Left Side: Standard Filters */}
                <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                    <button
                        onClick={onAdvancedFiltersClick}
                        className="flex min-w-max items-center space-x-2 rounded-lg bg-sacred-offwhite px-4 py-2 text-sm font-medium text-sacred-dark border border-gray-200 hover:border-gold-300 transition-colors"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span>Filters</span>
                    </button>

                    <div className="h-6 w-px bg-gray-300"></div>

                    <button
                        onClick={() => setActiveRite(activeRite === 'Syro-Malabar Catholic' ? null : 'Syro-Malabar Catholic')}
                        className={`flex items-center space-x-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-300 ${activeRite === 'Syro-Malabar Catholic'
                            ? 'bg-gold-600 border-gold-700 text-white shadow-md'
                            : 'border-gold-200 bg-gold-50 text-gold-800 hover:bg-gold-100'
                            }`}
                    >
                        <Church className="h-4 w-4" />
                        <span>Syro-Malabar</span>
                    </button>




                    <div className="relative group flex items-center">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gold-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search matches..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-200 text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400 focus:border-gold-400 w-48 sm:w-64 transition-all"
                        />
                    </div>
                </div>



            </div>
        </div>
    );
}
