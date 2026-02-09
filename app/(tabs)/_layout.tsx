import { Tabs, useRouter } from 'expo-router'
import { FC, useEffect, useMemo } from 'react'
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import themeObject from "@app/constants/theme";
import { Text, Image } from "react-native-ui-lib";
import DebugIcon from '../../src/components/icons/DebugIcon';
import PeopleIcon from '../../src/components/icons/PeopleIcon';
import { showSuccessToast } from '../../src/utils/ToastUtils';
import { getFromEnv } from '../../src/utils/EnvUtils';

const TabsLayout: FC = () => {
    const router = useRouter();
    const showDebugMenu = getFromEnv('EXPO_PUBLIC_DEBUG_MENU_ENABLED') === "true";

    const header = useMemo(() => {
        return (
            <SafeAreaView padding-10 style={{ backgroundColor: themeObject.colorScheme.light.background }}>
                <Text>Aware</Text>
            </SafeAreaView>
        )
    }, [useRouter()])

    useEffect(() => {
        if (showDebugMenu) {
            showSuccessToast('Debug Menu', 'Enabled');
        }
    }, [showDebugMenu]);


    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: 'blue',
                tabBarStyle: { height: 60 }
            }}
        >
            <Tabs.Screen name="Chat" options={{
                headerShown: false,
                title: 'Chat',
                tabBarIcon: ({ color }) => <Ionicons name="chatbox-ellipses-outline" size={28} color={color} />,
            }} />
            <Tabs.Screen name="Explore" options={{
                title: 'Explore',
                headerShown: false,
                tabBarIcon: ({ color }) => {
                    return <Image source={require('@assets/images/explore.png')} style={{ width: 28, height: 28, marginBottom: -3 }} />
                }
            }} />
            <Tabs.Screen name="index" options={{
                title: 'Profile',
                tabBarIcon: ({ color }) => <Image source={require('@assets/images/profile.png')} style={{ width: 28, height: 28, marginBottom: -3 }} />,
                headerShown: false
            }} />
            <Tabs.Screen name="Circles" options={{
                title: 'Circles',
                headerShown: false,
                tabBarIcon: ({ color, focused }) => <PeopleIcon width={28} height={28} color={color} filled={focused} />,
            }} />
            <Tabs.Screen name="ChatList" options={{
                headerShown: false,
                href: null
            }} />
            <Tabs.Screen name="People" options={{
                title: 'People',
                headerShown: false,
                href: null
            }} />
            <Tabs.Screen name="InsightDetails" options={{
                title: 'Insight',
                headerShown: false,
                href: null
            }} />
            <Tabs.Screen name="UserProfileInsightDetail" options={{
                title: 'Profile Insight',
                headerShown: false,
                href: null
            }} />
            <Tabs.Screen name="MyData" options={{
                title: 'My Data',
                headerShown: false,
                href: null
            }} />
            <Tabs.Screen name="DebugMenu" options={{
                title: 'Debug',
                headerShown: false,
                href: showDebugMenu ? 'DebugMenu' : null,
                tabBarIcon: ({ color }) => <DebugIcon color={color} size={28} />
            }} />
        </Tabs>
    )
}

export default TabsLayout