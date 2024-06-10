import { StyleSheet, AppState, View, Text, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from '@/firebaseConfig';
import { collection, onSnapshot } from "firebase/firestore";
import * as Speech from 'expo-speech';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-fetch';
let lastProcessedDocId:any = null; // Track the last processed document ID

// Define the background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log(`Background fetch executed at ${new Date().toLocaleTimeString()}`);

  try {
    onSnapshot(collection(db, 'texts'), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id !== lastProcessedDocId) { // Check if this is a new document
          const textData = doc.data().text;
          Speech.speak(textData, { language: 'en', rate: 1.0 });
          lastProcessedDocId = doc.id;
        }
      })
    })  

    // Stop the background fetch task after processing
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error(error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function HomeScreen() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState<BackgroundFetch.BackgroundFetchStatus | null>(null);
  const [data, setData] = useState('');

  useEffect(() => {
    checkStatusAsync();
    fetchFirestoreData();

    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log(`App state changed to ${nextAppState}`);
      if (nextAppState === 'background') {
        registerBackgroundFetchAsync().then(() => {
          console.log('Background Fetch is registered');
        });
      } else if (nextAppState === 'active') {
        unregisterBackgroundFetchAsync();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchFirestoreData = async () => {
    onSnapshot(collection(db, 'texts'), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id !== lastProcessedDocId) { // Check if this is a new document
          const textData = doc.data().text;
          setData(textData);
          Speech.speak(textData, { language: 'en', rate: 1.0 });
          lastProcessedDocId = doc.id; // Update the last processed document ID
        }
      });
    });
  };

  const checkStatusAsync = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    setStatus(status);
    setIsRegistered(isRegistered);
  };

  const registerBackgroundFetchAsync = async () => {
    console.log(`Background Fetch is ${isRegistered}`);
    return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 1, // 1 minute
    });
  };

  const unregisterBackgroundFetchAsync = async () => {
    return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  };

  const toggleFetchTask = async () => {
    if (isRegistered) {
      await unregisterBackgroundFetchAsync();
    } else {
      await registerBackgroundFetchAsync();
    }

    checkStatusAsync();
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text>Background fetch status: <Text style={styles.boldText}>{status && BackgroundFetch.BackgroundFetchStatus[status]}</Text></Text>
        <Text>Background fetch task name: <Text style={styles.boldText}>{isRegistered ? BACKGROUND_FETCH_TASK : 'Not registered yet!'}</Text></Text>
      </View>
      <Button
        title={isRegistered ? 'Unregister BackgroundFetch task' : 'Register BackgroundFetch task'}
        onPress={toggleFetchTask}
      />
      <Text style={styles.text}>Fetched Data: {data}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    margin: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
  },
});
