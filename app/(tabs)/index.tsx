import React, { useEffect, useState } from 'react';
import { StyleSheet, AppState, View, Text, Button } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

export default function HomeScreen() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    // Function to play the audio
    const playAudio = async () => {
      const { sound: soundObject } = await Audio.Sound.createAsync(
        { uri: 'https://file-examples.com/storage/fe3cb26995666504a8d6180/2017/11/file_example_MP3_700KB.mp3' },
        { shouldPlay: true, isLooping: true }
      );
      setSound(soundObject);
      await soundObject.playAsync();
    };

    // Configure audio for background playback
    const configureAudio = async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    };

    configureAudio();
    playAudio();

    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log(`App state changed to ${nextAppState}`);
    });

    return () => {
      subscription.remove();
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Audio should be playing in the background and foreground.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
  },
});
