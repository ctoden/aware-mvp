import React, { FC } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text } from 'react-native-ui-lib';
import { RelationshipType } from '@src/constants/relationshipTypes';
import { ReactiveTextField } from '@src/components/ReactiveTextField';
import { Observable } from '@legendapp/state';
import { ModalPicker } from '@src/components/ModalPicker';
import { customColors, elementColors } from '@app/constants/theme';
import { relationshipOptions } from '@src/constants/relationshipTypes';
import { CloseXIcon } from '@src/components/icons/CloseXIcon';

interface RelationshipDetailsItemProps {
    relationshipType$: Observable<RelationshipType>;
    name$: Observable<string>;
    index: number;
    onRemove: (index: number) => void;
}

export const RelationshipDetailsItem: FC<RelationshipDetailsItemProps> = ({
    relationshipType$,
    name$,
    index,
    onRemove
}) => {

    const handleRemoveRelationship = () => {
        onRemove(index);
    }

    return (
        <View row marginB-20 marginT-20 gap-4 style={styles.mainContainer}>
            <View>
                <Text style={styles.label}>Relationship</Text>
                <ModalPicker
                    value$={relationshipType$}
                    options={relationshipOptions}
                    placeholder="Select type"
                />
            </View>
            <View flex>
                <Text style={styles.label}>Name</Text>
                <View row spread gap-4>
                    <View flex-1 style={styles.inputContainer}>
                        <ReactiveTextField
                            value$={name$}
                            style={styles.input}
                            placeholder="Enter name"
                        />
                    </View>
                    <TouchableOpacity
                        flex-2
                        onPress={handleRemoveRelationship}
                        style={styles.closeBtn}
                    >
                        <CloseXIcon color={customColors.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        maxWidth: '100%',
    },
    inputContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        flexGrow: 1,
    },
    closeBtn: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        borderWidth: 1,
        borderColor: elementColors.inputBorderColor,
        backgroundColor: '#000',
        borderRadius: 90,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: elementColors.inputBorderColor,
        borderRadius: 90,
        paddingHorizontal: 16,
        fontSize: 16,
        flexShrink: 1,
        backgroundColor: elementColors.inputBackground,
    },
    label: {
        fontSize: 12,
        fontWeight: '400',
        color: '#545452',
        marginBottom: 4,
        paddingLeft: 4,
    },
    iconContainer: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
