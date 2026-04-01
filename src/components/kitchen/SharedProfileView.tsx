import { MapPin, ShieldCheck } from 'lucide-react';

export default function SharedProfileView({ profile }: { profile: any }) {
    if (!profile) return null;

    return (
        <div className="h-full w-full overflow-y-auto bg-sacred-offwhite p-6 no-scrollbar relative">
            <div className="sticky top-0 mb-6 flex items-center justify-between z-10 bg-sacred-offwhite/80 backdrop-blur-sm py-2">
                <h2 className="text-xl font-serif font-medium text-sacred-dark">Candidate Profile</h2>
                <div className="flex items-center space-x-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 border border-green-200">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Stage 2 Match: 94%</span>
                </div>
            </div>

            <div className="w-full overflow-hidden rounded-[2rem] bg-white shadow-xl border border-gold-100 mb-8 max-w-lg mx-auto">
                <div className="relative aspect-[3/4] w-full">
                    <img
                        src={profile.image}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                        <h1 className="font-serif text-4xl text-white drop-shadow-lg">
                            {profile.name}, {profile.age}
                        </h1>
                        <div className="mt-2 flex items-center space-x-3 text-white/90">
                            <span className="flex items-center text-sm font-medium">
                                <MapPin className="mr-1 h-4 w-4" /> {profile.location}
                            </span>
                            <span className="text-sm border-l border-white/40 pl-3">
                                {profile.rite}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-700 mb-3 border-b border-gold-100 pb-2">Family & Faith</h3>
                        <p className="font-serif text-sacred-dark leading-relaxed italic text-lg">
                            "Coming from a strong Knanaya background, I value the traditions my parents passed down. Sunday lunches and evening rosary were staples in our home..."
                        </p>
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold-700 mb-3 border-b border-gold-100 pb-2">AI Meaning Match Summary</h3>
                        <div className="bg-gold-50/50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed font-sans">
                            Extremely high alignment on core family values. Both the Candidate and {profile.name} expressed a strong desire to stay close to their extended families and maintain active involvement in their local Syro-Malabar diocese.
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
