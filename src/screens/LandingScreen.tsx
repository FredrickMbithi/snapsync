import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors, borderRadius, spacing } from '../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Landing'>;
};

// Demo nearby events (will be replaced with mDNS discovery)
const DEMO_NEARBY = [
  { id: '1', name: "Mia's Graduation 🎓", code: 'KP-7392', host: 'Mia', people: 34, photos: 127, emoji: '🎓' },
  { id: '2', name: 'Rooftop NYE 🎆', code: 'WT-5510', host: 'Chris', people: 68, photos: 312, emoji: '🎆' },
];

export default function LandingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>📡 OFFLINE · PEER TO PEER</Text>
          </View>
          
          <Text style={styles.title}>SNAP</Text>
          <Text style={styles.titleGold}>SYNC</Text>
          
          <Text style={styles.subtitle}>
            One room. Everyone's camera.{'\n'}Pick what you want.
          </Text>
        </View>

        {/* Nearby Events Section */}
        <View style={styles.nearbySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLabelContainer}>
              <View style={styles.mdnsDot} />
              <Text style={styles.sectionLabel}>NEARBY EVENTS</Text>
            </View>
            <Text style={styles.mdnsStatus}>MDNS ACTIVE</Text>
          </View>
          
          {DEMO_NEARBY.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.nearbyCard}
              onPress={() => navigation.navigate('Join')}
              activeOpacity={0.8}
            >
              <View style={styles.nearbyThumb}>
                <Text style={styles.nearbyEmoji}>{event.emoji}</Text>
              </View>
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyTitle}>{event.name}</Text>
                <Text style={styles.nearbyMeta}>
                  {event.people} people · {event.photos} photos · by {event.host}
                </Text>
              </View>
              <View style={styles.joinPill}>
                <Text style={styles.joinPillText}>JOIN</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTAs */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.btnGold}
          onPress={() => navigation.navigate('CreateRoom')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnGoldText}>＋  Host an Event</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.navigate('Join')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnOutlineText}>Join with Code ›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  
  // Hero
  hero: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.goldFade,
    borderWidth: 1,
    borderColor: 'rgba(240,180,41,0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  badgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 4,
    lineHeight: 72,
  },
  titleGold: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.gold,
    letterSpacing: 4,
    lineHeight: 72,
    marginTop: -8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: spacing.md,
  },
  
  // Nearby Section
  nearbySection: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mdnsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
    color: colors.text3,
  },
  mdnsStatus: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    color: colors.green,
  },
  nearbyCard: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: borderRadius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nearbyThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  nearbyEmoji: {
    fontSize: 22,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  nearbyMeta: {
    fontSize: 12,
    color: colors.text2,
  },
  joinPill: {
    backgroundColor: 'rgba(46,213,115,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(46,213,115,0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  joinPillText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: colors.green,
  },
  
  // CTAs
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: 12,
  },
  btnGold: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnGoldText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  btnOutline: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.border2,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
