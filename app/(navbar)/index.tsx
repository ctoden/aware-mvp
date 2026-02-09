import {View} from 'react-native'
import {observer} from "@legendapp/state/react";
import UserProfileScreen from "@app/screens/UserProfileScreen";

const NavbarIndexComponent: React.FC = observer(() => {
    
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <UserProfileScreen />
        </View>
    )
})

export default function NavbarIndex() {
    return <NavbarIndexComponent />
} 