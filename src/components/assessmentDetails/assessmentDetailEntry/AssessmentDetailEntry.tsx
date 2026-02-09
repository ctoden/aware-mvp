import { Text, View } from 'react-native-ui-lib';
import { StyleSheet } from 'react-native';
import { customColors } from '@app/constants/theme';
import { H2 } from '@src/components/text/H2';
import { BodyRegular } from '@src/components/text/BodyRegular';

interface IAssessmentDetailEntryProps {
    title: string;
    copy: string;
}

const AssessmentDetailEntry: React.FC<IAssessmentDetailEntryProps> = ({ title, copy }) => {
    return (
        <View style={styles.container}>
            <H2>{title}</H2>
            <BodyRegular noMargins noPadding>{copy}</BodyRegular>
        </View>
    )
}
export default AssessmentDetailEntry
const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 18,
        marginBottom: 48
    },
    title: {

    }
})