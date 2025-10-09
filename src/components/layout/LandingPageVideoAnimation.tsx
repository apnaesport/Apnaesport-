"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LandingPageVideoAnimation() {
    const videoRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        const textElement = textRef.current;
        if (!videoElement || !textElement) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: videoElement,
                start: "top top",
                end: "bottom+=200 bottom",
                scrub: 1,
                pin: true,
            }
        });

        // Animate text opacity
        tl.fromTo(textElement, 
            { opacity: 0, y: -50 }, 
            { opacity: 1, y: 0, duration: 1 },
            0 // Start at the beginning of the timeline
        );

        // Animate video scale and border radius
        tl.to(videoElement, {
            scale: 0.9,
            borderRadius: "24px",
            duration: 2,
            ease: "power2.inOut"
        }, 0.5); // Start slightly after text animation

        return () => {
            if (ScrollTrigger.getTweensOf(videoElement).length > 0) {
                ScrollTrigger.killAll();
            }
        }

    }, []);

    return (
        <div ref={videoRef} className="h-screen w-full relative flex items-center justify-center">
            <h1 ref={textRef} className="text-4xl md:text-6xl font-bold text-center text-white absolute z-10 opacity-0">
                The Future of Esports is Here
            </h1>
            <video 
                className="absolute top-0 left-0 w-full h-full object-cover"
                src="https://res.cloudinary.com/dodzjp0gr/video/upload/v1754655447/Untitled_design_h5zmtw.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline 
            />
        </div>
    );
}
