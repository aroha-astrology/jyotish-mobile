import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { TopBar } from '@/components/layout/TopBar';

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={c} strokeWidth={active ? 2 : 1.5} fill={active ? `${colors.primary}20` : 'none'}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={c} strokeWidth={active ? 2 : 1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LifeIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"
        stroke={c} strokeWidth={active ? 2.5 : 2} fill={active ? `${colors.primary}18` : 'none'}
        strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={3} stroke={c} strokeWidth={active ? 2 : 1.5} fill={active ? colors.primary : 'none'} />
    </Svg>
  );
}

function RewardsIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={c} strokeWidth={active ? 0 : 2} fill={active ? c : 'none'}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke={c} strokeWidth={active ? 0 : 2} fill={active ? c : 'none'}
        strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? colors.primary : colors.textMuted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={active ? 0 : 2} fill={active ? c : 'none'} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={7} r={4} stroke={c} strokeWidth={active ? 0 : 2} fill={active ? c : 'none'} />
    </Svg>
  );
}

function TabIcon({ children }: { children: React.ReactNode }) {
  return <View style={styles.tabItem}>{children}</View>;
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon><HomeIcon active={focused} /></TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="life-journey"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon><LifeIcon active={focused} /></TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon><RewardsIcon active={focused} /></TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon><ChatIcon active={focused} /></TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon><ProfileIcon active={focused} /></TabIcon>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(2,1,10,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,168,67,0.12)',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
