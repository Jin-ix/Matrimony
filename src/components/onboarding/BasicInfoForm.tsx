import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface BasicInfoFormProps {
    role: 'candidate' | 'scout';
    onComplete: () => void;
}

export default function BasicInfoForm({ role, onComplete }: BasicInfoFormProps) {
    const isScout = role === 'scout';
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'female' | 'male' | ''>('');
    const [rite, setRite] = useState('SYRO_MALABAR');
    
    // Scout-specific states
    const [houseName, setHouseName] = useState('');
    const [fatherOccupation, setFatherOccupation] = useState('');
    const [motherOccupation, setMotherOccupation] = useState('');
    const [parish, setParish] = useState('');

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
            
            const linkedCandidateId = localStorage.getItem('linkedCandidateId');
            const targetUserId = (isScout && linkedCandidateId) ? linkedCandidateId : userId;

            if (!targetUserId) throw new Error("No target user ID found. Please try refreshing or logging in again.");

            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0] || 'Unknown';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

            // Check if profile exists
            const { data: existingProfile } = await supabase.from('Profile').select('id').eq('userId', targetUserId).single();
            
            const now = new Date().toISOString();
            const profileData: any = {
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

            if (isScout) {
                profileData.familyValues = houseName ? `House Name: ${houseName}` : null;
                profileData.fatherOccupation = fatherOccupation || null;
                profileData.motherOccupation = motherOccupation || null;
                profileData.parish = parish || null;
            }

            if (existingProfile) {
                const { error: updateError } = await supabase.from('Profile').update(profileData).eq('userId', targetUserId);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from('Profile').insert([{
                    id: crypto.randomUUID(),
                    userId: targetUserId,
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
        <div className="w-full max-w-md p-8 glass rounded-[2.5rem] backdrop-blur-2xl border border-white/40 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] max-h-[85vh] overflow-y-auto pr-3">
            <h2 className="text-3xl font-serif text-sacred-dark text-center mb-2">
                {isScout ? 'Candidate Setup' : 'Basic Setup'}
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
                {isScout ? "Let's start with their fundamental details." : "Let's start with your fundamental details."}
            </p>
            
            {error && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-sacred-dark mb-1">
                        {isScout ? "Candidate's Full Name" : 'Full Name'}
                    </label>
                    <input 
                        type="text" required value={name} onChange={e => setName(e.target.value)}
                        className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500 transition-colors" 
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-sacred-dark mb-1">
                            {isScout ? "Candidate's Age" : 'Age'}
                        </label>
                        <input 
                            type="number" min="18" max="100" required value={age} onChange={e => setAge(e.target.value)}
                            className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500 transition-colors" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-sacred-dark mb-1">
                            {isScout ? "Candidate's Gender" : 'Gender'}
                        </label>
                        <select 
                            required value={gender} onChange={e => setGender(e.target.value as any)}
                            className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500 transition-colors"
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
                        className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500 transition-colors"
                    >
                        <option value="SYRO_MALABAR">Syro-Malabar</option>
                        <option value="LATIN">Latin</option>
                        <option value="KNANAYA_CATHOLIC">Knanaya Catholic</option>
                        <option value="MALANKARA_ORTHODOX">Malankara Orthodox</option>
                        <option value="SYRO_MALANKARA">Syro-Malankara</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                {isScout && (
                    <div className="border-t border-gold-200/50 pt-4 mt-4 space-y-4">
                        <h3 className="text-md font-serif text-gold-700 font-medium tracking-wide border-b border-gold-100 pb-1">
                            Family Identity & Roots
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-sacred-dark mb-1">Tharavadu / House Name</label>
                            <input 
                                type="text" value={houseName} onChange={e => setHouseName(e.target.value)}
                                className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500 transition-colors" 
                                placeholder="e.g., Alappat, Kalarickal"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-sacred-dark mb-1">Father's Occupation</label>
                                <input 
                                    type="text" value={fatherOccupation} onChange={e => setFatherOccupation(e.target.value)}
                                    className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500 transition-colors" 
                                    placeholder="e.g., Retired Officer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-sacred-dark mb-1">Mother's Occupation</label>
                                <input 
                                    type="text" value={motherOccupation} onChange={e => setMotherOccupation(e.target.value)}
                                    className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500 transition-colors" 
                                    placeholder="e.g., Homemaker"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-sacred-dark mb-1">Ancestral Root Parish</label>
                            <input 
                                type="text" value={parish} onChange={e => setParish(e.target.value)}
                                className="w-full rounded-xl border border-gold-200 bg-white/50 py-3 px-4 text-sacred-dark outline-none focus:border-gold-500 transition-colors" 
                                placeholder="e.g., St. Thomas Church, Palai"
                            />
                        </div>
                    </div>
                )}

                <button 
                    type="submit" disabled={loading}
                    className="mt-4 w-full rounded-xl bg-sacred-dark py-4 text-white font-medium hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                    {loading ? 'Saving...' : 'Continue'}
                </button>
            </form>
        </div>
    );
}
