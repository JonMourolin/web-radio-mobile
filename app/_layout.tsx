import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Platform, Animated } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Navigation from './components/Navigation';
import { PlayerProvider } from '@/context/PlayerContext';
import SEOHead from '@/components/SEOHead';
import DiscoveryModal from './components/DiscoveryModal';


// Explicitly import the tabs layout to see if it affects bundling in preview
// import './(tabs)/_layout'; // Removing this explicit import

console.log('[RootLayout] File loaded');

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  console.log('[RootLayout] Component rendering');
  // We'll use simple readiness flags for now
  const [appIsReady, setAppIsReady] = useState(false);
  const [rootViewRendered, setRootViewRendered] = useState(false);
  
  // Conditional animation setup based on platform
  // Web: No animation to avoid useNativeDriver issues
  // Native: Keep existing smooth animation
  const [contentOpacity] = useState(Platform.OS === 'web' ? 1 : new Animated.Value(0));

  useEffect(() => {
    console.log('[RootLayout] useEffect running');
    // Simulate app preparation (e.g., loading assets, fonts)
    async function prepare() {
      try {
        // In a real app, you'd await things like Font.loadAsync here
        console.log("Simulating app preparation...");
        await new Promise(resolve => setTimeout(resolve, 2000)); // Example delay
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        console.log("App is marked as ready.");
      }
    }
    prepare();
  }, []);

  // Callback for the root view's onLayout prop
  const onLayoutRootView = useCallback(async () => {
    console.log("Root view layout finished.");
    setRootViewRendered(true);
    if (appIsReady) {
      console.log("Hiding splash screen (onLayout). App was already ready.");
      await SplashScreen.hideAsync();
      
      // Start fade-in animation only on native platforms
      if (Platform.OS !== 'web') {
        Animated.timing(contentOpacity as Animated.Value, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      }
    }
  }, [appIsReady]); // Depend on appIsReady

  // Hide splash if layout finishes *after* app is ready
  useEffect(() => {
    if (appIsReady && rootViewRendered) {
      console.log("Hiding splash screen (useEffect). Layout was already ready.");
      SplashScreen.hideAsync().then(() => {
        // Start fade-in animation only on native platforms
        if (Platform.OS !== 'web') {
          Animated.timing(contentOpacity as Animated.Value, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        }
      });
    }
  }, [appIsReady, rootViewRendered]);

  // Only render the main layout once the splash screen is ready to be hidden
  // or has already been hidden (appIsReady && rootViewRendered)
  if (!appIsReady || !rootViewRendered) {
     console.log(`App not ready/rendered yet: appIsReady=${appIsReady}, rootViewRendered=${rootViewRendered}. Splash should be visible.`);
    // Return null while the splash screen is visible and the app is preparing/rendering
    // We attach onLayout to a temporary View ONLY WHEN appIsReady is true but layout isn't
    // This ensures onLayout fires correctly after prepare() finishes
    return appIsReady ? <View style={{flex: 1}} onLayout={onLayoutRootView} /> : null;
  }

  // App is ready and root view has rendered, render the actual layout
  console.log("Rendering main app layout.");
  return (
    <PlayerProvider>
      <SEOHead 
        title="Mood Radio - Listen to your moods"
        description="Listen to your moods : Focus, High Energy, Melancholic, Rave, Explore. Stream curated electronic radio stations 24/7."
        keywords="electronic music moods, focus music, meditation music, high energy music, melancholic music, rave music, ambient radio, electronic radio stations"
      />
      {/* Attach onLayout here to the final root view */}
      <Animated.View style={{ flex: 1, backgroundColor: '#121418', opacity: contentOpacity }} onLayout={onLayoutRootView}>
        {Platform.OS === 'web' && <Navigation />}
        <Stack 
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#121418' }
          }}
        >
        </Stack>
        <DiscoveryModal />
      </Animated.View>
    </PlayerProvider>
  );
}
