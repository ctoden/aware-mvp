import {View} from 'react-native'
import UserProfileScreen from "@app/screens/UserProfileScreen";

export default function TabIndex() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <UserProfileScreen />
    </View>
  )
} 