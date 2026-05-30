import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuidedTour } from '../../lib/GuidedTourContext';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

export default function GuidedTourOverlay() {
    const { isActive, currentStepIndex, steps, nextStep, prevStep, endTour } = useGuidedTour();
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = steps[currentStepIndex];

    const updateRect = useCallback(() => {
        if (!isActive || !step) return;
        const el = document.querySelector(step.targetSelector);
        if (el) {
            // Scroll element into view smoothly if not visible
            const rect = el.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // We'll catch the updated rect in the next animation frames
            }
            setTargetRect(el.getBoundingClientRect());
        }
    }, [isActive, step]);

    useEffect(() => {
        if (isActive) {
            updateRect();
            // Continuously update to handle scrolls and layout shifts
            let frame: number;
            const loop = () => {
                updateRect();
                frame = requestAnimationFrame(loop);
            };
            frame = requestAnimationFrame(loop);
            window.addEventListener('resize', updateRect);
            window.addEventListener('scroll', updateRect, true);
            
            // Block background scrolling on body
            document.body.style.overflow = 'hidden';

            return () => {
                cancelAnimationFrame(frame);
                window.removeEventListener('resize', updateRect);
                window.removeEventListener('scroll', updateRect, true);
                document.body.style.overflow = '';
            };
        }
    }, [isActive, updateRect]);

    if (!isActive || !step) return null;

    const padding = 12;

    // Calculate popup position with viewport clamping
    let popupTop = '50%';
    let popupLeft = '50%';
    let transform = 'translate(-50%, -50%)';

    if (targetRect) {
        const placement = step.placement || 'bottom';
        // We estimate the popup is ~320px wide and ~250px tall
        const POPUP_W_HALF = 160;
        const POPUP_H_HALF = 125;
        const WIN_W = window.innerWidth;
        const WIN_H = window.innerHeight;

        if (placement === 'bottom') {
            let topPx = targetRect.bottom + padding + 16;
            // If it goes off the bottom, flip it to top
            if (topPx + 250 > WIN_H) topPx = targetRect.top - padding - 16 - 250;
            
            let leftPx = targetRect.left + targetRect.width / 2;
            leftPx = Math.max(POPUP_W_HALF + 16, Math.min(leftPx, WIN_W - POPUP_W_HALF - 16));
            
            popupTop = `${topPx}px`;
            popupLeft = `${leftPx}px`;
            transform = topPx < targetRect.top ? 'translate(-50%, 0)' : 'translate(-50%, 0)';
        } else if (placement === 'top') {
            let topPx = targetRect.top - padding - 16;
            // If it goes off the top, flip it to bottom
            if (topPx - 250 < 0) topPx = targetRect.bottom + padding + 16 + 250;

            let leftPx = targetRect.left + targetRect.width / 2;
            leftPx = Math.max(POPUP_W_HALF + 16, Math.min(leftPx, WIN_W - POPUP_W_HALF - 16));

            popupTop = `${topPx}px`;
            popupLeft = `${leftPx}px`;
            transform = topPx > targetRect.bottom ? 'translate(-50%, -100%)' : 'translate(-50%, -100%)';
        } else if (placement === 'right') {
            let topPx = targetRect.top + targetRect.height / 2;
            topPx = Math.max(POPUP_H_HALF + 16, Math.min(topPx, WIN_H - POPUP_H_HALF - 16));

            popupTop = `${topPx}px`;
            popupLeft = `${targetRect.right + padding + 16}px`;
            transform = 'translate(0, -50%)';
        } else if (placement === 'left') {
            let topPx = targetRect.top + targetRect.height / 2;
            topPx = Math.max(POPUP_H_HALF + 16, Math.min(topPx, WIN_H - POPUP_H_HALF - 16));

            popupTop = `${topPx}px`;
            popupLeft = `${targetRect.left - padding - 16}px`;
            transform = 'translate(-100%, -50%)';
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Spotlight Hole using Box Shadow */}
            {targetRect && (
                <motion.div
                    initial={false}
                    animate={{
                        top: targetRect.top - padding,
                        left: targetRect.left - padding,
                        width: targetRect.width + padding * 2,
                        height: targetRect.height + padding * 2,
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute rounded-2xl shadow-[0_0_0_9999px_rgba(15,20,25,0.7)] backdrop-blur-[2px] pointer-events-auto border border-white/10"
                >
                    {/* Pulsing ring inside the spotlight */}
                    <div className="absolute -inset-2 rounded-2xl border-2 border-gold-400/50 animate-pulse" />
                </motion.div>
            )}

            {/* Popup Card */}
            <AnimatePresence mode="wait">
                <div
                    key={`wrapper-${currentStepIndex}`}
                    className="absolute z-[10000] pointer-events-none"
                    style={{
                        top: popupTop,
                        left: popupLeft,
                        transform,
                    }}
                >
                    <motion.div
                        key={currentStepIndex}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-80 max-w-[calc(100vw-32px)] pointer-events-auto"
                    >
                        <div className="bg-white/95 backdrop-blur-xl border border-gold-200 shadow-2xl rounded-3xl overflow-hidden p-6 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-300/10 blur-3xl rounded-full pointer-events-none" />
                            
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-bold tracking-widest uppercase text-gold-600">
                                        Step {currentStepIndex + 1} of {steps.length}
                                    </span>
                                </div>
                                <button
                                    onClick={endTour}
                                    className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                                    title="Skip Tour"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <h3 className="font-serif text-xl text-sacred-dark mb-2 leading-tight">
                                {step.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed mb-6">
                                {step.content}
                            </p>

                            <div className="flex items-center justify-between">
                                <button
                                    onClick={prevStep}
                                    disabled={currentStepIndex === 0}
                                    className="text-sm font-medium text-gray-500 hover:text-sacred-dark transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" /> Back
                                </button>

                                <button
                                    onClick={nextStep}
                                    className="bg-gold-600 hover:bg-gold-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-1"
                                >
                                    {currentStepIndex === steps.length - 1 ? 'Finish Tour' : 'Next'}
                                    {currentStepIndex < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        </div>
    );
}
