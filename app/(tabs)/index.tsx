import { StyleSheet, View } from 'react-native';
import AudioPlayer from '@/components/AudioPlayer';


export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <AudioPlayer />
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
