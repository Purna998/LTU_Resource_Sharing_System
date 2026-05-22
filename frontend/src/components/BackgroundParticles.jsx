import React, { useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const BackgroundParticles = () => {
  const [init, setInit] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

  // Initialize tsparticles engine once
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // Use slim to save bandwidth (loads basic shapes, links, moves)
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });

    // Observe theme changes
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setTheme(currentTheme || 'light');
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fullScreen: {
        enable: false, // IMPORTANT: Keeps it bounded to parent div instead of window
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "grab", // Subtle grab connections towards the mouse
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 150,
            links: {
              opacity: 0.3,
              color: "#93c5fd"
            },
          },
        },
      },
      particles: {
        color: {
          value: "#93c5fd",
        },
        links: {
          color: "#7dd3fc",
          distance: 150,
          enable: true,
          opacity: 0.2,
          width: 1,
        },
        move: {
          direction: "none", // Floating in random directions (antigravity)
          enable: true,
          outModes: {
            default: "bounce", // Keep them on screen
          },
          random: true,
          speed: 0.6, // Very slow and calm
          straight: false,
        },
        number: {
          density: {
            enable: true,
            area: 900,
          },
          value: 70,
        },
        opacity: {
          value: { min: 0.2, max: 0.5 },
          animation: {
            enable: true,
            speed: 0.8,
            sync: false,
          }
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 2.5 },
        },
      },
      detectRetina: true,
    }),
    [theme],
  );

  if (init) {
    return (
      <Particles
        id="tsparticles"
        options={options}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0, // Behind hero content, contained by section
          pointerEvents: "none"
        }}
        className="tsparticles-canvas"
      />
    );
  }

  return null;
};

export default BackgroundParticles;
