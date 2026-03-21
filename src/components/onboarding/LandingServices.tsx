import { motion } from 'framer-motion';

const services = [
    {
        title: "Sacred Matchmaking",
        description: "Carefully curated matching algorithm that prioritizes shared faith, rite, and family values for a holy union.",
        image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1469&auto=format&fit=crop" // Church aisle
    },
    {
        title: "Verified Community",
        description: "Strict background and identity verification ensures you are interacting in a safe, authentic environment.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop" // Authentic portrait / community feel
    },
    {
        title: "Pre-Cana Guidance",
        description: "Access to spiritual resources, expert advice, and preparation materials for the sacrament of Matrimony.",
        image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=1470&auto=format&fit=crop" // Rings/Bible
    },
    {
        title: "Family Integration",
        description: "Unique tools granting families collaborative access to help guide and support the matchmaking journey.",
        image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1470&auto=format&fit=crop" // Family/Gathering
    },
    {
        title: "Privacy First",
        description: "Industry-leading encryption and discrete communication channels keep your sacred journey private.",
        image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1470&auto=format&fit=crop" // Silhouette / intimate moment
    }
];

export default function LandingServices() {
    return (
        <section
            className="relative w-full py-24 px-6 text-pearl-50 overflow-hidden font-sans bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2670&auto=format&fit=crop')` }} // Elegant dark wedding aesthetic
        >
            {/* Darker background overlay for the premium feel and readability */}
            <div className="absolute inset-0 z-0 bg-sacred-dark/95 backdrop-blur-[2px] pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 blur-[100px] pointer-events-none" />

            <div className="mx-auto max-w-7xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <span className="text-gold-400 font-semibold tracking-[0.2em] uppercase text-sm mb-4 block">
                        Our Values & Services
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight drop-shadow-md">
                        A Framework for Forever
                    </h2>
                    <div className="w-16 h-1 bg-gold-400 mx-auto rounded-full mb-6"></div>
                    <p className="text-lg text-pearl-200 leading-relaxed font-light">
                        Discover a premium matrimonial experience built on the foundational pillars of the Catholic faith, delivering trust, tradition, and profound connection.
                    </p>
                </motion.div>

                <div className="flex flex-col gap-16 md:gap-24">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-16`}
                        >
                            {/* Image Side */}
                            <div className="w-full md:w-1/2">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.5 }}
                                    className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gold-900/20 group"
                                >
                                    <div className="absolute inset-0 bg-gold-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="w-full h-64 md:h-80 object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sacred-dark/80 to-transparent z-10" />
                                </motion.div>
                            </div>

                            {/* Text Side */}
                            <div className="w-full md:w-1/2 space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <h3 className="text-3xl font-serif text-gold-300">
                                        {index + 1 < 10 ? `0${index + 1}` : index + 1}.
                                    </h3>
                                    <h4 className="text-2xl md:text-3xl font-medium tracking-wide">
                                        {service.title}
                                    </h4>
                                </div>
                                <p className="text-pearl-200 text-lg leading-relaxed font-light">
                                    {service.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}