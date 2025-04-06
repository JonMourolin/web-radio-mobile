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

// Type pour les métadonnées
interface StreamMetadata {
  title: string;
  artist: string;
  album: string;
  song: string;
  artUrl?: string;
}

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

  const [currentTrack, setCurrentTrack] = useState<StreamMetadata>({
    title: '',
    artist: '',
    album: '',
    song: ''
  });

  // Fonction pour mettre à jour les métadonnées
  const updateMetadata = async () => {
    try {
      const response = await fetch('http://51.75.200.205/api/nowplaying/tangerine_radio');
      const data = await response.json();
      
      if (data.now_playing) {
        const track = data.now_playing;
        setCurrentTrack({
          title: track.song.title || '',
          artist: track.song.artist || '',
          album: track.song.album || 'Unknown Album',
          song: track.song.title || 'Web Radio',
          artUrl: track.song.art || null
        });
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  // Initialize audio and metadata polling
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
          { uri: 'http://51.75.200.205/listen/tangerine_radio/radio.mp3' },
          { shouldPlay: false, volume: volume / 100 }
        );
        
        soundRef.current = sound;

        // Initial metadata fetch
        updateMetadata();

        // Set up metadata polling
        const metadataInterval = setInterval(updateMetadata, 5000);

        return () => {
          clearInterval(metadataInterval);
        };
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
              source={{ 
                uri: currentTrack.artUrl || 'https://via.placeholder.com/300x300.png?text=WEB+RADIO'
              }}
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
                {currentTrack.song || 'Web Radio'}
              </Text>
              <View style={styles.trackMetaContainer}>
                <View style={styles.trackMetaItem}>
                  <Feather name="user" size={12} color={theme.primary} style={styles.trackMetaIcon} />
                  <Text style={[styles.trackMetaText, { color: theme.foreground }]}>
                    {currentTrack.artist || 'Various Artists'}
                  </Text>
                </View>
                {currentTrack.album && (
                  <View style={styles.trackMetaItem}>
                    <Feather name="disc" size={12} color={theme.primary} style={styles.trackMetaIcon} />
                    <Text style={[styles.trackMetaText, { color: theme.foreground }]}>
                      {currentTrack.album}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Player controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.transportControls}>
              <TouchableOpacity 
                style={[
                  styles.playButton, 
                  { 
                    borderColor: theme.primary,
                    backgroundColor: isPlaying ? `${theme.primary}20` : 'transparent'
                  }
                ]}
                onPress={togglePlay}
              >
                <Feather 
                  name={isPlaying ? "pause" : "play"} 
                  size={24} 
                  color={theme.primary} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.volumeControls}>
              <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                <Feather 
                  name={isMuted ? "volume-x" : "volume-2"} 
                  size={16} 
                  color={theme.mutedForeground} 
                />
              </TouchableOpacity>
              <Slider
                style={styles.volumeSlider}
                minimumValue={0}
                maximumValue={100}
                value={isMuted ? 0 : volume}
                onValueChange={handleVolumeChange}
                step={1}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.muted}
                thumbTintColor={theme.primary}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Platform.OS === 'ios' ? 40 : 60, // Adjust padding for different platforms
    paddingHorizontal: 20,
  },
  currentTrackContainer: {
    alignItems: 'center',
    marginBottom: 40, // Increased spacing
    position: 'relative',
  },
  coverArtContainer: {
    width: '100%',
    aspectRatio: 1, // Maintain square aspect ratio
    borderRadius: 20, // Rounded corners
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative', // For absolute positioning of overlay
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    borderBottomWidth: 1, // Add subtle border
  },
  coverArt: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40, // Fixed height for waveform
  },
  waveformBar: {
    width: 6, // Width of each bar
    marginHorizontal: 3, // Spacing between bars
    borderRadius: 3, // Rounded corners for bars
    height: 10, // Minimum height
  },
  trackInfoOverlay: {
    position: 'absolute',
    bottom: 20, // Positioned slightly above the bottom edge
    left: 20,
    right: 20,
    alignItems: 'center', // Center align track info
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent background
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12, // Rounded corners for the overlay
  },
  nowPlayingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    // TODO: Add pulsing animation if desired
  },
  nowPlayingText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  trackTitle: {
    fontSize: 20, // Larger font size
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8, // Increased spacing
  },
  trackMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12, // Spacing between meta items
    marginBottom: 4, // Spacing for wrap
  },
  trackMetaIcon: {
    marginRight: 4,
  },
  trackMetaText: {
    fontSize: 12,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  transportControls: {
    marginBottom: 30, // Spacing below play button
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%', // Take up most of the width
  },
  muteButton: {
    marginRight: 10,
    padding: 5,
  },
  volumeSlider: {
    flex: 1,
  },
}); 