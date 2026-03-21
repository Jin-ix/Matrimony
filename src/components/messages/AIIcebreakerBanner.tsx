import { Sparkles } from 'lucide-react';

export default function AIIcebreakerBanner({ matchName }: { matchName: string }) {
    return (
        <div className="mx-4 mt-6 rounded-[2rem] bg-gradient-to-br from-gold-50 via-white to-gold-50 p-[2px] shadow-sm">
            <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white/80 px-6 py-8 text-center backdrop-blur-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-600 shadow-sm border border-gold-200">
                    <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-medium text-sacred-dark">
                    A Shared Foundation
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-gray-600 font-sans italic">
                    Both you and {matchName} emphasized the importance of maintaining strong ties with your extended families and attending Sunday Mass together. Perhaps ask about their favorite childhood family tradition?
                </p>
            </div>
        </div>
    );
}
