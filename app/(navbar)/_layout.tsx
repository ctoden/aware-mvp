import { FC } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Link, Slot } from 'expo-router'
import LogoutButton from '@app/components/LogoutButton'
import { getFromEnv } from '@src/utils/EnvUtils'

const NavBarLayout: FC = () => {
  const showDebugMenu = getFromEnv('EXPO_PUBLIC_DEBUG_MENU_ENABLED') === "true";

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <View style={styles.content}>
          <View style={styles.leftContent}>
            <Text style={styles.logo}>Aware</Text>
          </View>
          <View style={styles.centerContent}>
            <View style={styles.navLinks}>
              <Link href="/(navbar)/Chat" style={styles.link}>Chat</Link>
              <Link href="/(navbar)/Explore" style={styles.link}>Explore</Link>
              <Link href="/(navbar)/" style={styles.link}>Profile</Link>
              <Link href="/(navbar)/Circles" style={styles.link}>Circles</Link>
              {showDebugMenu && (
                <Link href="/(navbar)/DebugMenu" style={styles.link}>Debug</Link>
              )}
            </View>
          </View>
          <View style={styles.rightContent}>
            <LogoutButton />
          </View>
        </View>
      </View>
      <Slot />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  navbar: {
    height: 60,
    backgroundColor: '#333',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: '100%',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerContent: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  rightContent: {
    // Align logout button to the right
  },
  logo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 15,
  },
  navLinks: {
    flexDirection: 'row',
  },
  link: {
    color: '#fff',
    marginLeft: 15,
    fontSize: 16,
  },
})

export default NavBarLayout