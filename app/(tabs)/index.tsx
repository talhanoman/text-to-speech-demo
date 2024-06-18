import React, { useEffect, useState } from 'react';
import { StyleSheet, AppState, View, Text, Button } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { collection, onSnapshot, } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
// import * as Speech from 'expo-speech';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import axios from 'axios';

// Background fetch task name
const BACKGROUND_FETCH_TASK = 'background-fetch';

let lastProcessedDocId: any = null; 
let sound: any = null;

async function fetchFirestoreData() {
  try {
    onSnapshot(collection(db, 'texts'), async (snapshot) => { 
      let sentence = '';
  
      snapshot.forEach((doc) => {
        if (doc.id !== lastProcessedDocId) { 
          const textData = doc.data().text;
          sentence += textData + ' ';
          console.clear();
          console.log('Text Data:', textData);
          lastProcessedDocId = doc.id; 
        }
      });
  
      if (sentence !== '') { 
        try {
          const response = await axios.post('http://13.201.68.104:3000/convert', { text: sentence });
          const audioUrl = response.data.audioUrl;
          await playAudio(audioUrl); 
        } catch (error) {
          console.error('Error converting or playing audio:', error);
        }
      }
    });
        
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error(error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
}

async function playAudio(audioUri: string) {
  if (sound) {
    await sound.unloadAsync();
  }
  const { sound: soundObject } = await Audio.Sound.createAsync(
    { uri: audioUri },
    { shouldPlay: true, isLooping: false }
  );
  sound = soundObject;
  await soundObject.playAsync();
}

// Register the background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await fetchFirestoreData();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function initBackgroundFetch() {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    // minimumInterval: 10, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
  await BackgroundFetch.setMinimumIntervalAsync(15 * 60); // 15 minutes
}

export default function HomeScreen() {
  // const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
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
    initBackgroundFetch();
  }, []);

  const handleFetch = async () => { // Make the function async

    // Initialize lastProcessedDocId to an empty string or the previously stored value
    let lastProcessedDocId = '';
  
    const unsubscribe = onSnapshot(collection(db, 'texts'), async (snapshot) => { // Use async within onSnapshot
      let sentence = '';
  
      snapshot.forEach((doc) => {
        if (doc.id !== lastProcessedDocId) { // Check for new documents
          const textData = doc.data().text;
          sentence += textData + ' ';
          console.clear();
          console.log('Text Data:', textData);
          lastProcessedDocId = doc.id; // Update immediately upon encountering a new doc
        }
      });
  
      if (sentence !== '') { // Only process audio if there's new text
        try {
          const response = await axios.post('http://13.201.68.104:3000/convert', { text: sentence });
          const audioUrl = response.data.audioUrl;
          await playAudio(audioUrl); // Ensure playAudio waits for conversion
        } catch (error) {
          console.error('Error converting or playing audio:', error);
        }
      }
    });
  
    // Consider returning unsubscribe for potential cleanup later (if needed)
    return unsubscribe;
  };
  

  // const [data, setData] = useState('');
  // const fetchFirestoreData = async () => {
  //   onSnapshot(collection(db, 'texts'), (snapshot) => {
  //     snapshot.forEach((doc) => {
  //       if (doc.id !== lastProcessedDocId) { // Check if this is a new document
  //         const textData = doc.data().text;
  //         setData(textData);
  //         Speech.speak(textData, { language: 'en', rate: 1.0 });
  //         lastProcessedDocId = doc.id; // Update the last processed document ID
  //       }
  //     });
  //   });
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Audio should be playing in the background and foreground.</Text>
      <Button title="Fetch" onPress={handleFetch} />
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
    color: 'red'
  },
});
