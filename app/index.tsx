import { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';

export default function SplashScreenPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const authReady = useStore((s) => s.authReady);
  const charts = useStore((s) => s.charts);
  const hasNavigated = useRef(false);

  const navigate = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    if (!user) {
      router.replace('/login');
    } else if (charts.length === 0) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, charts.length]);

  // Navigate when video ends AND auth is ready
  const videoRef = useRef<Video>(null);
  const videoFinished = useRef(false);
  const authReadyRef = useRef(false);

  const tryNavigate = useCallback(() => {
    if (videoFinished.current && authReadyRef.current) {
      navigate();
    }
  }, [navigate]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      videoFinished.current = true;
      tryNavigate();
    }
  }, [tryNavigate]);

  useEffect(() => {
    if (!authReady) return;
    authReadyRef.current = true;
    tryNavigate();
  }, [authReady, tryNavigate]);

  // Hard fallback — 6s covers any video/auth edge case
  useEffect(() => {
    const fallback = setTimeout(navigate, 6000);
    return () => clearTimeout(fallback);
  }, [navigate]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Video
        ref={videoRef}
        source={require('../assets/LOADING.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        isMuted
        useNativeControls={false}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
