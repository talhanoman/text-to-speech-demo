import { StyleSheet, AppState, View, Text, Button } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from '@/firebaseConfig';
import { collection, onSnapshot } from "firebase/firestore";
import * as Speech from 'expo-speech';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Audio } from 'expo-av';
const BACKGROUND_FETCH_TASK = 'background-fetch';
let lastProcessedDocId: any = null; // Track the last processed document ID

// Define the background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  console.log(`Background fetch executed at ${new Date().toLocaleTimeString()}`);
  
  try {
    const soundObject = new Audio.Sound();
    await soundObject.loadAsync({
      uri : 'https://file-examples.com/storage/fe3cb26995666504a8d6180/2017/11/file_example_MP3_700KB.mp3'
    });
    await soundObject.setIsLoopingAsync(true);
    await soundObject.playAsync();

    onSnapshot(collection(db, 'texts'), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id !== lastProcessedDocId) { // Check if this is a new document
          const textData = doc.data().text;
          Speech.speak(textData, { language: 'en', rate: 1.0 });
          lastProcessedDocId = doc.id;
        }
      });
    });

    await soundObject.unloadAsync();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error(error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});


export default function HomeScreen() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState<BackgroundFetch.BackgroundFetchStatus | null>(null);
  const [data, setData] = useState([]);


  const playSilentAudio = async () => {
    const soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync({
        uri : 'https://file-examples.com/storage/fe3cb26995666504a8d6180/2017/11/file_example_MP3_700KB.mp3'
      });
      await soundObject.setIsLoopingAsync(true);
      await soundObject.playAsync();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setData([]);
    playSilentAudio()
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
    let temp: any = [];
    setData([]);
    onSnapshot(collection(db, 'texts'), (snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.id !== lastProcessedDocId) {
          const textData = doc.data().text;
          temp.push(textData);
          Speech.speak(textData, { language: 'en', rate: 1.0 });
          lastProcessedDocId = doc.id;
        }
      });
      setData(temp);
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
        <Text style={{
          color: "skyblue"
        }}>Background fetch status: <Text style={styles.boldText}>{status && BackgroundFetch.BackgroundFetchStatus[status]}</Text></Text>
        <Text style={{
          color: "skyblue"
        }}>Background fetch task name: <Text style={styles.boldText}>{isRegistered ? BACKGROUND_FETCH_TASK : 'Not registered yet!'}</Text></Text>
      </View>
      <Button
        title={isRegistered ? 'Unregister BackgroundFetch task' : 'Register BackgroundFetch task'}
        onPress={toggleFetchTask}
      />
      <Text style={styles.text}>Fetched Data:</Text>
      {
        data &&
        data?.map((text, index) => {
          return (
            <Text style={{
              color: "red"
            }} key={index + 1}>{index + 1}: {text}</Text>
          )
        })}

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
