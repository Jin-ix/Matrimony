import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, EyeOff, UserCircle2, ArrowRight, X } from 'lucide-react';

interface MediaUploadProps {
    onFinish: (photos: { file: File, preview: string, isBlurred: boolean }[]) => void;
}

export default function MediaUploadModal({ onFinish }: MediaUploadProps) {
    const [photos, setPhotos] = useState<{ file: File, preview: string, isBlurred: boolean }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [globalBlur, setGlobalBlur] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        
        setIsUploading(true);
        const newFiles = Array.from(e.target.files).slice(0, 3 - photos.length);
        
        // Simulate a slight upload delay for UX
        setTimeout(() => {
            const newPhotos = newFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                isBlurred: globalBlur
            }));
            
            setPhotos(prev => [...prev, ...newPhotos]);
            setIsUploading(false);
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }, 800);
    };

    const removePhoto = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setPhotos(prev => {
            const newPhotos = [...prev];
            URL.revokeObjectURL(newPhotos[index].preview);
            newPhotos.splice(index, 1);
            return newPhotos;
        });
    };

    const toggleGlobalBlur = () => {
        const newBlurState = !globalBlur;
        setGlobalBlur(newBlurState);
        setPhotos(prev => prev.map(p => ({ ...p, isBlurred: newBlurState })));
    };

    return (
        <div className="flex w-full max-w-md flex-col items-center justify-center p-8 glass rounded-[2.5rem] relative overflow-hidden backdrop-blur-2xl border border-white/40 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-6 flex flex-col items-center space-y-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-rose-100 text-rose-600 shadow-inner border border-rose-200">
                    <UserCircle2 className="h-10 w-10 text-rose-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-serif text-sacred-dark mb-2">A Picture is Worth a Thousand Words</h2>
                    <p className="text-sm leading-relaxed text-gray-600 px-2 font-sans">
                        Upload a few recent photos. Profiles with clear, friendly photos receive significantly more meaningful connections.
                    </p>
                </div>
            </div>

            <div className="w-full flex items-center justify-between mb-4 px-2">
                <span className="text-sm font-medium text-sacred-dark">Privacy Mode</span>
                <button
                    onClick={toggleGlobalBlur}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${globalBlur ? 'bg-rose-500' : 'bg-gray-200'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${globalBlur ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
            {globalBlur && (
                <p className="w-full px-2 text-xs text-rose-600 mb-4 flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Photos will be blurred to others until you accept their request.
                </p>
            )}

            <div className="w-full mb-8">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                />
                
                <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2].map((slot) => {
                        const photo = photos[slot];
                        
                        return (
                            <div
                                key={slot}
                                className={`aspect-[3/4] relative rounded-2xl border-2 flex flex-col items-center justify-center overflow-hidden group transition-colors cursor-pointer shadow-sm hover:shadow-md ${photo ? 'border-gold-300 bg-white' : 'border-dashed border-gold-200 bg-gold-50/30 hover:border-gold-400 hover:bg-gold-50/50'
                                    }`}
                                onClick={() => !photo && fileInputRef.current?.click()}
                            >
                                <AnimatePresence>
                                    {photo ? (
                                        <motion.div
                                            key="photo"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="absolute inset-0 bg-white flex items-center justify-center w-full h-full"
                                        >
                                            <img 
                                                src={photo.preview} 
                                                alt={`Upload ${slot}`} 
                                                className={`w-full h-full object-cover transition-all ${photo.isBlurred ? 'blur-md scale-110' : ''}`}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    onClick={(e) => removePhoto(slot, e)}
                                                    className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm text-white transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="empty"
                                            className="flex flex-col items-center space-y-2 opacity-60 group-hover:opacity-100 transition-opacity w-full h-full justify-center"
                                            initial={false}
                                            animate={{ opacity: isUploading && photos.length === slot ? 0 : 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <ImageIcon className="h-6 w-6 text-gold-600" />
                                            <p className="text-[10px] text-gold-700 font-bold uppercase tracking-widest text-center px-1">Add Photo</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {isUploading && photos.length === slot && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0 bg-white/90 flex items-center justify-center backdrop-blur-sm z-10"
                                    >
                                        <div className="h-6 w-6 rounded-full border-[3px] border-gold-400 border-t-transparent animate-spin"></div>
                                    </motion.div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <motion.button
                whileHover={{ scale: photos.length > 0 ? 1.02 : 1 }}
                whileTap={{ scale: photos.length > 0 ? 0.98 : 1 }}
                onClick={() => onFinish(photos)}
                disabled={photos.length === 0}
                className={`flex items-center justify-center w-full rounded-2xl py-4 text-center font-medium transition-all duration-300 ${photos.length > 0
                        ? 'bg-sacred-dark text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    }`}
            >
                <span className="mr-2">{photos.length > 0 ? 'Complete Profile' : 'Upload a photo to continue'}</span>
                {photos.length > 0 && <ArrowRight className="h-4 w-4" />}
            </motion.button>

            {photos.length === 0 && (
                <button
                    onClick={() => onFinish([])}
                    className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-sacred-dark transition-colors"
                >
                    Skip for now
                </button>
            )}
        </div>
    );
}
