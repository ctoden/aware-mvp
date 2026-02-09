import { View, Text } from 'react-native'
import LogoutButton from "@app/components/LogoutButton";

export default function TabIndex() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>People Tab</Text>
        <LogoutButton />
    </View>
  )
} 