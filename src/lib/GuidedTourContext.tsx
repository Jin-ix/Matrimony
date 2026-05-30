import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface TourStep {
    targetSelector: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourContextType {
    isActive: boolean;
    currentStepIndex: number;
    steps: TourStep[];
    startTour: (steps: TourStep[]) => void;
    nextStep: () => void;
    prevStep: () => void;
    endTour: () => void;
}

const GuidedTourContext = createContext<GuidedTourContextType | undefined>(undefined);

export function GuidedTourProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [steps, setSteps] = useState<TourStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const startTour = (newSteps: TourStep[]) => {
        if (!newSteps || newSteps.length === 0) return;
        setSteps(newSteps);
        setCurrentStepIndex(0);
        setIsActive(true);
    };

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            endTour();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const endTour = () => {
        setIsActive(false);
        setSteps([]);
        setCurrentStepIndex(0);
    };

    return (
        <GuidedTourContext.Provider
            value={{
                isActive,
                currentStepIndex,
                steps,
                startTour,
                nextStep,
                prevStep,
                endTour,
            }}
        >
            {children}
        </GuidedTourContext.Provider>
    );
}

export function useGuidedTour() {
    const context = useContext(GuidedTourContext);
    if (context === undefined) {
        throw new Error('useGuidedTour must be used within a GuidedTourProvider');
    }
    return context;
}
