import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Settings, Image as ImageIcon, MapPin, Church, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface UserProfileModalProps {
    onClose: () => void;
    onSettingsClick?: () => void;
}

export default function UserProfileModal({ onClose, onSettingsClick }: UserProfileModalProps) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);

    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                let userId = localStorage.getItem('userId');
                if (!userId) {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        try {
                            userId = JSON.parse(userStr).id;
                        } catch (e) {
                            return;
                        }
                    }
                }
                if (!userId) return;
                
                const { data, error } = await supabase.from('Profile').select('*').eq('userId', userId).single();
                if (error) console.error(error);
                if (data) setProfile(data);

                // Fetch photo safely
                const { data: photoData } = await supabase.from('Photo').select('*').eq('userId', userId).eq('isPrimary', true).limit(1);
                if (photoData && photoData.length > 0) setPhotoUrl(photoData[0].url);
                else {
                    const { data: anyPhoto } = await supabase.from('Photo').select('*').eq('userId', userId).limit(1);
                    if (anyPhoto && anyPhoto.length > 0) setPhotoUrl(anyPhoto[0].url);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/auth');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gold-200 bg-sacred-offwhite px-6 py-4">
                    <h2 className="font-serif text-2xl text-sacred-dark">My Profile</h2>
                    <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gold-50 hover:text-sacred-dark transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* User Info Header */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative h-24 w-24">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-gold-50 to-gold-100 border border-gold-300 shadow-sm text-gold-700 text-3xl font-serif overflow-hidden">
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    profile ? profile.firstName.charAt(0) : 'C'
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 rounded-full bg-white p-1.5 shadow-md border border-gray-100 hover:bg-gray-50">
                                <ImageIcon className="h-4 w-4 text-sacred-dark" />
                            </button>
                        </div>
                        <div className="text-center">
                            <h3 className="font-serif text-2xl text-sacred-dark truncate px-4 max-w-[250px]">
                                {profile ? `${profile.firstName} ${profile.lastName}` : (
                                    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).email : 'Candidate'
                                )}
                            </h3>
                            <p className="text-sm font-medium text-gold-600 uppercase tracking-wider">{localStorage.getItem('userRole') || 'Candidate'}</p>
                        </div>
                    </div>

                    {/* Basic Details */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <MapPin className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</p>
                                <p className="text-sm font-medium text-sacred-dark">{profile?.location || 'Unknown'}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                            <Church className="h-5 w-5 text-gray-400" />
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Church Rite</p>
                                <p className="text-sm font-medium text-sacred-dark">{profile?.rite || 'Unknown'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Hobbies */}
                    {profile?.hobbies && profile.hobbies.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-serif text-lg text-sacred-dark border-b border-gold-100 pb-2 flex items-center">
                                <Heart className="mr-2 h-5 w-5 text-gold-500" /> Hobbies & Interests
                            </h4>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {profile.hobbies.map((hobby: string, index: number) => (
                                    <span key={index} className="px-3 py-1.5 bg-sacred-offwhite text-sacred-dark rounded-xl text-sm font-medium border border-gold-200">
                                        {hobby}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Settings & Preferences */}
                    <div className="space-y-3">
                        <h4 className="font-serif text-lg text-sacred-dark border-b border-gold-100 pb-2">Preferences</h4>
                        <button
                            onClick={onSettingsClick}
                            className="w-full flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 hover:border-gold-300 transition-colors"
                        >
                            <span className="text-sm font-medium text-gray-700">Account Settings</span>
                            <Settings className="h-5 w-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-sacred-offwhite">
                    <button
                        onClick={handleLogout}
                        className="w-full rounded-2xl bg-sacred-dark py-4 font-medium text-white transition-transform hover:scale-[1.02] active:scale-95"
                    >
                        Log Out
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
