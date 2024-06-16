import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Button, AppState } from 'react-native';
import * as Speech from 'expo-speech';

export default function App() {
  useEffect(() => {
    // Function to speak text
    const speakText = async (text: string) => {
      try {
        await Speech.speak(text, { language: 'en', rate: 1.0 });
      } catch (error) {
        console.error('Failed to speak:', error);
      }
    };

    // Speak text on component mount
    speakText('Hello, this is a sample text to be converted to speech.');

    // Handle app state changes
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App is in the foreground, speak the text again
        speakText('Hello, this is a sample text to be converted to speech.');
      } else if (nextAppState === 'background') {
        // App is in the background, configure audio session for background playback
        await Speech.speak('background task is running', { language: 'en', rate: 1.0 });
      }
    };

    // Subscribe to app state changes
    (AppState as any).addEventListener('change', handleAppStateChange);

    // Unsubscribe from app state changes when component unmounts
    return () => {
      (AppState as any).removeEventListener('change', handleAppStateChange);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Press the button to hear the text!</Text>
      <Button title="Speak Text" onPress={() => Speech.speak('Hello, world!')} />
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
    fontSize: 18,
    marginBottom: 20,
  },
});
