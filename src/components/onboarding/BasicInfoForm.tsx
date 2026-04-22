import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface BasicInfoFormProps {
    onComplete: () => void;
}

export default function BasicInfoForm({ onComplete }: BasicInfoFormProps) {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'female' | 'male' | ''>('');
    const [rite, setRite] = useState('SYRO_MALABAR');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const userStr = localStorage.getItem('user');
            const authUser = userStr ? JSON.parse(userStr) : null;
            const userId = authUser?.id || localStorage.getItem('userId');
            
            if (!userId) throw new Error("No user ID found. Please try refreshing or logging in again.");

            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

            // Check if profile exists
            const { data: existingProfile } = await supabase.from('Profile').select('id').eq('userId', userId).single();
            
            const now = new Date().toISOString();
            const profileData = {
                firstName,
                lastName,
                age: parseInt(age) || 25,
                gender: gender || 'male',
                location: 'Unknown',
                rite: rite,
                bio: '',
                profileComplete: 0.2,
                updatedAt: now,
            };

            if (existingProfile) {
                const { error: updateError } = await supabase.from('Profile').update(profileData).eq('userId', userId);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from('Profile').insert([{
                    id: crypto.randomUUID(),
                    userId: userId,
                    createdAt: now,
                    ...profileData
                }]);
                if (insertError) throw insertError;
            }

            // Sync localStorage
            localStorage.setItem('userGender', profileData.gender);
            
            onComplete();
        } catch (err: any) {
            setError(err.message || "Failed to save profile setup.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 glass rounded-[2.5rem] backdrop-blur-2xl border border-white/40 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            <h2 className="text-3xl font-serif text-sacred-dark text-center mb-2">Basic Setup</h2>
            <p className="text-sm text-gray-600 text-center mb-6">Let's start with your fundamental details.</p>
            
            {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-sacred-dark mb-1">Full Name</label>
                    <input 
                        type="text" required value={name} onChange={e => setName(e.target.value)}
                        className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500" 
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-sacred-dark mb-1">Age</label>
                        <input 
                            type="number" min="18" max="100" required value={age} onChange={e => setAge(e.target.value)}
                            className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sacred-dark mb-1">Gender</label>
                        <select 
                            required value={gender} onChange={e => setGender(e.target.value as any)}
                            className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500"
                        >
                            <option value="" disabled>Select</option>
                            <option value="male">Man</option>
                            <option value="female">Woman</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-sacred-dark mb-1">Church Rite</label>
                    <select 
                        required value={rite} onChange={e => setRite(e.target.value)}
                        className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500"
                    >
                        <option value="SYRO_MALABAR">Syro-Malabar</option>
                        <option value="LATIN">Latin</option>
                        <option value="KNANAYA_CATHOLIC">Knanaya Catholic</option>
                        <option value="MALANKARA_ORTHODOX">Malankara Orthodox</option>
                        <option value="SYRO_MALANKARA">Syro-Malankara</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                <button 
                    type="submit" disabled={loading}
                    className="mt-4 w-full rounded-xl bg-sacred-dark py-4 text-white font-medium hover:scale-[1.02] transition-all"
                >
                    {loading ? 'Saving...' : 'Continue'}
                </button>
            </form>
        </div>
    );
}
