// audio setup
const keyStrokeSounds = [
  "/sounds/keystroke1.mp3",
  "/sounds/keystroke2.mp3",
  "/sounds/keystroke3.mp3",
  "/sounds/keystroke4.mp3",
];

function useKeyboardSound() {
  const playRandomKeyStrokeSound = () => {
    const randomSoundPath =
      keyStrokeSounds[Math.floor(Math.random() * keyStrokeSounds.length)];

    try {
      const audio = new Audio(randomSoundPath);
      audio.volume = 0.5; // Set reasonable volume
      audio.currentTime = 0;

      // Attempt to play and catch any errors
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Audio play failed:", error.message);
        });
      }
    } catch (error) {
      console.log("Audio creation failed:", error.message);
    }
  };

  return { playRandomKeyStrokeSound };
}

export default useKeyboardSound;
