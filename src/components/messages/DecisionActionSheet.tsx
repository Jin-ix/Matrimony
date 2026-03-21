import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DecisionActionSheet({ onClose, onAction }: { onClose: () => void, onAction: (action: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl z-50 pt-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-gray-300 sm:hidden"></div>
                <div className="p-6">
                    <h3 className="mb-6 text-center font-serif text-xl text-sacred-dark">Connection Options</h3>

                    <div className="space-y-3">
                        <button
                            onClick={() => onAction('continue')}
                            className="w-full rounded-2xl bg-sacred-dark py-4 text-sm font-medium text-white transition-colors hover:bg-black"
                        >
                            Continue Connecting
                        </button>
                        <button
                            onClick={() => onAction('pause')}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            Pause (Ghost Mode)
                        </button>
                        <button
                            onClick={() => onAction('close')}
                            className="w-full rounded-2xl bg-red-50 py-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                        >
                            Respectfully Close
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-6 w-full text-center text-sm font-medium text-gray-500 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
