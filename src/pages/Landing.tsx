import { useNavigate } from 'react-router-dom';

import LandingHero from '../components/onboarding/LandingHero';
import LandingAbout from '../components/onboarding/LandingAbout';
import LandingServices from '../components/onboarding/LandingServices';
import LandingHowItWorks from '../components/onboarding/LandingHowItWorks';
import LandingCTA from '../components/onboarding/LandingCTA';

export default function Landing() {
    const navigate = useNavigate();

    const handleStartJourney = () => {
        navigate('/auth');
    };

    return (
        <div className="relative min-h-screen w-full bg-pearl-50 text-sacred-dark font-sans overflow-y-auto overflow-x-hidden scroll-smooth">
            <LandingHero onStart={handleStartJourney} />
            <LandingAbout />
            <LandingServices />
            <LandingHowItWorks />
            <LandingCTA onStart={handleStartJourney} />
        </div>
    );
}
