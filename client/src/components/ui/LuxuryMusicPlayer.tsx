import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X, Music } from 'lucide-react';
import speedDialMusic from '@/zero-7-speed-dial.mp3';

export function LuxuryMusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true); // Enabled by default
  const [volume, setVolume] = useState(0.10); // Default 10%
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio(speedDialMusic);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const startPlaying = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          cleanup();
        })
        .catch((err) => {
          console.log('Interaction playback failed', err);
        });
    };

    const cleanup = () => {
      document.removeEventListener('click', startPlaying);
      document.removeEventListener('touchstart', startPlaying);
      document.removeEventListener('keydown', startPlaying);
    };

    // Try autoplay immediately
    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.log('Autoplay blocked, registering user interaction listeners:', err);
        // Fallback to interaction listeners
        document.addEventListener('click', startPlaying);
        document.addEventListener('touchstart', startPlaying);
        document.addEventListener('keydown', startPlaying);
      });

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      cleanup();
    };
  }, []);

  // Sync Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Broadcast music play/pause status to canvas particle engine
  useEffect(() => {
    const event = new CustomEvent('lounge-music-status', { detail: { isPlaying } });
    window.dispatchEvent(event);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log('Audio playback failed', err));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed bottom-6 left-6 z-[45]">
      {/* 1. Floating Round Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-black shadow-glow-gold hover:shadow-glow-gold-lg border border-accent-gold/20 outline-none transition-all flex-shrink-0 cursor-pointer"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 text-black" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-center"
            >
              <Music className={`w-5 h-5 text-black ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              {isPlaying && (
                <div className="absolute flex gap-0.5 items-end h-2 w-3.5 -bottom-1">
                  <span className="w-[1.5px] bg-black soundwave-bar-btn h-[60%] rounded-full animate-bounce" />
                  <span className="w-[1.5px] bg-black soundwave-bar-btn h-[90%] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-[1.5px] bg-black soundwave-bar-btn h-[40%] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 2. Expanding Glass Player Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="fixed bottom-24 left-4 right-4 sm:right-auto sm:left-0 sm:absolute sm:bottom-18 w-[calc(100vw-2rem)] sm:w-80 bg-dark-bg/95 border border-glass-border rounded-2xl overflow-hidden shadow-2xl flex flex-col backdrop-blur-glass z-50 p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-glass-border/40">
              <span className="text-xs font-display font-bold text-accent-gold uppercase tracking-wider">Lounge Player</span>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white/70">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Info & Disk Artwork */}
            <div className="flex items-center gap-4">
              {/* Spinning Disc Artwork */}
              <div className="relative w-16 h-16 rounded-full bg-black/60 flex items-center justify-center border border-accent-gold/20 flex-shrink-0">
                <motion.div
                  className="w-12 h-12 rounded-full border-2 border-dashed border-accent-gold/50 flex items-center justify-center"
                  animate={isPlaying ? { rotate: 360 } : {}}
                  transition={isPlaying ? { repeat: Infinity, duration: 8, ease: 'linear' } : {}}
                >
                  <Music className="w-5 h-5 text-accent-gold" />
                </motion.div>
                <div className="absolute w-3 h-3 rounded-full bg-dark-bg border border-accent-gold/40 center" />
              </div>

              {/* Title Info */}
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-semibold text-white truncate">Zero 7</div>
                <div className="text-[10px] text-white/50 truncate mt-0.5">Speed Dial</div>
                {/* Soundwave animation */}
                {isPlaying && (
                  <div className="flex gap-1 items-end h-4 mt-2">
                    <span className="w-1 bg-accent-gold soundwave-bar h-[60%] rounded-full" />
                    <span className="w-1 bg-accent-gold soundwave-bar h-[100%] rounded-full animate-delay-200" />
                    <span className="w-1 bg-accent-gold soundwave-bar h-[50%] rounded-full animate-delay-500" />
                    <span className="w-1 bg-accent-gold soundwave-bar h-[80%] rounded-full animate-delay-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar & Timing */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleProgressBarChange}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-gold outline-none"
              />
              <div className="flex justify-between text-[9px] text-white/40 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume Control & Play/Pause buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={handleTogglePlay}
                className="w-10 h-10 rounded-full bg-accent-gold text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.10)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-accent-gold" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-gold outline-none"
                />
                <span className="text-[9px] text-white/40 font-mono w-6 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .soundwave-bar-btn {
          animation: soundwave 1s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  );
}
