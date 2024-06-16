// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button, View } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';

const AudioPlayer: React.FC = () => {
  const sound = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);

  const loadSound = async () => {
    const { sound: soundObject } = await Audio.Sound.createAsync(
      {
        uri : 'https://file-examples.com/storage/fe3cb26995666504a8d6180/2017/11/file_example_MP3_700KB.mp3'
      }
    );
    sound.current = soundObject;
  };

  const playSound = async () => {
    if (sound.current) {
      await sound.current.playAsync();
      setIsPlaying(true);
    }
  };

  const stopSound = async () => {
    if (sound.current) {
      await sound.current.stopAsync();
      setIsPlaying(false);
    }
  };

  const fadeVolume = async (toValue: number, duration: number) => {
    if (sound.current) {
      const status: AVPlaybackStatus = await sound.current.getStatusAsync();
      if (status.isLoaded) {
        const initialVolume = status.volume;
        const steps = 50;
        const stepTime = duration / steps;
        const volumeStep = (toValue - initialVolume) / steps;

        for (let i = 0; i <= steps; i++) {
          await sound.current.setVolumeAsync(initialVolume + volumeStep * i);
          await new Promise(resolve => setTimeout(resolve, stepTime));
        }
      }
    }
  };

  const fadeIn = async (duration = 3000) => {
    if (sound.current) {
      await sound.current.setVolumeAsync(0);
      await playSound();
      await fadeVolume(1, duration);
    }
  };

  const fadeOut = async (duration = 3000) => {
    if (sound.current) {
      await fadeVolume(0, duration);
      await stopSound();
    }
  };

  return (
    <View>
      <Button title="Load Sound" onPress={loadSound} />
      <Button title="Fade In" onPress={() => fadeIn(3000)} disabled={isPlaying} />
      <Button title="Fade Out" onPress={() => fadeOut(3000)} disabled={!isPlaying} />
    </View>
  );
};

export default AudioPlayer;
