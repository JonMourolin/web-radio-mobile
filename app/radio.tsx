import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { useIcecastMetadata } from '@/hooks/useIcecastMetadata';

// Theme colors
const colors = {
  light: {
    background: '#f7f8fa',
    foreground: '#1a1c20',
    card: '#f7f8fa',
    cardForeground: '#1a1c20',
    primary: '#ff8000',
    primaryForeground: '#f7f8fa',
    secondary: '#ebedf0',
    secondaryForeground: '#1a1c20',
    muted: '#ebedf0',
    mutedForeground: '#646b7a',
    border: '#ebedf0',
  },
  dark: {
    background: '#121418',
    foreground: '#f7f8fa',
    card: '#121418',
    cardForeground: '#f7f8fa',
    primary: '#ff8000',
    primaryForeground: '#f7f8fa',
    secondary: '#1e2126',
    secondaryForeground: '#f7f8fa',
    muted: '#1e2126',
    mutedForeground: '#a3a9b8',
    border: '#1e2126',
  }
};

export default function RadioScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const soundRef = useRef<Audio.Sound | null>(null);
  const waveformAnimation = useRef(new Animated.Value(0)).current;
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const { metadata, error } = useIcecastMetadata(isPlaying);

  // Initialize audio
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          allowsRecordingIOS: false,
          interruptionModeIOS: 2,
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1,
          playThroughEarpieceAndroid: false,
        });
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'http://51.75.200.205:8000/stream.mp3' },
          { shouldPlay: false, volume: volume / 100 }
        );
        
        soundRef.current = sound;
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    }
    
    setupAudio();
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(isMuted ? 0 : volume / 100);
    }
  }, [volume, isMuted]);

  // Waveform animation
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveformAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true
          }),
          Animated.timing(waveformAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      waveformAnimation.setValue(0);
    }
    
    return () => {
      waveformAnimation.stopAnimation();
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!soundRef.current) return;
    
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  };

  const toggleMute = async () => {
    if (!soundRef.current) return;
    
    try {
      await soundRef.current.setVolumeAsync(isMuted ? volume / 100 : 0);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  };

  const handleVolumeChange = async (value: number) => {
    setVolume(value);
    
    if (!soundRef.current) return;
    
    try {
      await soundRef.current.setVolumeAsync(value / 100);
      if (value === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    } catch (error) {
      console.error("Error changing volume:", error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { minHeight: '100%', justifyContent: 'center' }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Current track with large cover */}
        <View style={styles.currentTrackContainer}>
          <View style={[styles.coverArtContainer, { borderBottomColor: theme.border }]}>
            <Image
              source={{ uri: 'https://via.placeholder.com/300x300.png?text=WEB+RADIO' }}
              style={styles.coverArt}
              resizeMode="cover"
            />
            
            {/* Visualization overlay */}
            <LinearGradient
              colors={[
                'transparent', 
                `${colorScheme === 'dark' ? '#121418' : '#f7f8fa'}30`, 
                `${colorScheme === 'dark' ? '#121418' : '#f7f8fa'}90`
              ]}
              style={styles.coverGradient}
            >
              {/* Waveform visualization */}
              <View style={styles.waveformContainer}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <Animated.View 
                    key={index}
                    style={[
                      styles.waveformBar,
                      { 
                        backgroundColor: theme.primary,
                        height: Animated.multiply(
                          waveformAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 40]
                          }),
                          Math.random() * 0.8 + 0.6
                        ),
                        opacity: isPlaying ? 0.7 : 0.3
                      }
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>
            
            <View style={styles.trackInfoOverlay}>
              <View style={styles.nowPlayingIndicator}>
                <View style={[styles.pulsingDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.nowPlayingText, { color: theme.primary }]}>
                  {isPlaying ? 'NOW PLAYING' : 'READY TO PLAY'}
                </Text>
              </View>
              <Text style={[styles.trackTitle, { color: theme.foreground }]}>
                {metadata?.title || 'Web Radio Mixes'}
              </Text>
              <View style={styles.trackMetaContainer}>
                <View style={styles.trackMetaItem}>
                  <Feather name="user" size={12} color={theme.primary} style={styles.trackMetaIcon} />
                  <Text style={[styles.trackMetaText, { color: theme.foreground }]}>
                    {metadata?.artist || 'Various Artists'}
                  </Text>
                </View>
                <View style={styles.trackMetaItem}>
                  <Feather name="radio" size={12} color={theme.primary} style={styles.trackMetaIcon} />
                  <Text style={[styles.trackMetaText, { color: theme.foreground }]}>
                    Live Stream
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Player controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[
                styles.playButton, 
                { backgroundColor: isPlaying ? `${theme.primary}20` : 'transparent' }
              ]}
              onPress={togglePlay}
            >
              <Feather 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color={theme.primary} 
              />
            </TouchableOpacity>
            
            <View style={styles.volumeContainer}>
              <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                <Feather 
                  name={isMuted || volume === 0 ? "volume-x" : volume < 50 ? "volume-1" : "volume-2"} 
                  size={20} 
                  color={theme.foreground}
                />
              </TouchableOpacity>
              
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={100}
                value={volume}
                onValueChange={handleVolumeChange}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.muted}
                thumbTintColor={theme.primary}
              />
              
              <Text style={[styles.volumeText, { color: theme.foreground }]}>
                {volume}%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  currentTrackContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  coverArtContainer: {
    aspectRatio: 1,
    width: '100%',
    position: 'relative',
    borderBottomWidth: 1,
  },
  coverArt: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 40,
    width: '100%',
    marginBottom: 20,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
  trackInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  nowPlayingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  nowPlayingText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  trackMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  trackMetaIcon: {
    marginRight: 6,
  },
  trackMetaText: {
    fontSize: 14,
  },
  controlsContainer: {
    padding: 20,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 128, 0, 0.2)',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muteButton: {
    padding: 8,
  },
  volumeSlider: {
    flex: 1,
    marginHorizontal: 12,
  },
  volumeText: {
    minWidth: 44,
    textAlign: 'right',
    fontSize: 14,
  },
}); 