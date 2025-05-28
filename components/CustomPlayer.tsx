import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";

export default function CustomAudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setProgress(newTime);
  };

  const formatTime = (time: number) =>
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(
      2,
      "0"
    )}`;

  return (
    <div
      style={{
        background: "#4e4cb8",
        padding: "10px 12px",
        borderRadius: "12px",
        maxWidth: "300px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <button
        onClick={togglePlay}
        style={{ background: "transparent", border: "none", color: "#fff" }}
      >
        {isPlaying ? (
          <Ionicons name="pause-outline" size={24} color="black" />
        ) : (
          <Ionicons name="caret-forward-outline" size={24} color="black" />
        )}
      </button>
      <input
        type="range"
        min={0}
        max={duration}
        value={progress}
        onChange={handleSliderChange}
        style={{ flex: 1 }}
      />
      {/* <span style={{ color: "#fff", fontSize: "12px" }}>
        {formatTime(progress)} / {formatTime(duration)}
      </span> */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
      />
    </div>
  );
}
