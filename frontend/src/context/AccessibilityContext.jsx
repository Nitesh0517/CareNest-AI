import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(null);

export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('eldercare_font_size') || 'normal');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('eldercare_high_contrast') === 'true');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('eldercare_sound') !== 'false');
  const [notificationsAllowed, setNotificationsAllowed] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission === 'granted' : false
  );

  // Apply font size and contrast classes to document.body
  useEffect(() => {
    document.body.classList.remove('font-large', 'font-xl');
    if (fontSize === 'large') {
      document.body.classList.add('font-large');
    } else if (fontSize === 'xl') {
      document.body.classList.add('font-xl');
    }
    localStorage.setItem('eldercare_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('eldercare_high_contrast', highContrast.toString());
  }, [highContrast]);

  // Audio tone synthesizer using Web Audio API
  const playTone = (type = 'chime') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'chime' || type === 'success') {
        // Cheerful two-tone chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'sos' || type === 'alert') {
        // High attention alert pulse
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn("Audio synthesizer error:", e);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        setNotificationsAllowed(granted);
        if (granted) {
          new Notification('ElderCare AI Reminders Active', {
            body: 'You will receive on-time reminders when it is time to take your medicine.',
            icon: '/favicon.ico'
          });
        }
        return granted;
      } catch (err) {
        console.error("Failed requesting notification permission", err);
        return false;
      }
    }
    return false;
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        highContrast,
        setHighContrast,
        toggleHighContrast: () => setHighContrast(prev => !prev),
        soundEnabled,
        setSoundEnabled: (val) => {
          setSoundEnabled(val);
          localStorage.setItem('eldercare_sound', val.toString());
        },
        notificationsAllowed,
        requestNotificationPermission,
        playTone
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
