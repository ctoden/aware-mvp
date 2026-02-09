import { customColors } from '@app/constants/theme';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Text, TouchableOpacity, View, TextField } from 'react-native-ui-lib';
import DateTimePicker, { DateType } from 'react-native-ui-datepicker';
import dayjs from "dayjs";
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useViewModel } from '@src/hooks/useViewModel';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { FTUX_Routes } from "@src/models/NavigationModel";
import { updateUserProfile, userProfile$ } from '@src/models/UserProfile';
import { showErrorToast } from '@src/utils/ToastUtils';
import typography from 'react-native-ui-lib/src/style/typography';

const DISPLAY_FORMAT = 'MM-DD-YYYY';
const STORAGE_FORMAT = 'YYYY-MM-DD';

interface DateInputs {
    month: string;
    day: string;
    year: string;
}

export const BirthDateScreen: FC = () => {
    const [date, setDate] = useState<dayjs.Dayjs | null>();
    const [dateInputs, setDateInputs] = useState<DateInputs>({ month: '', day: '', year: '' });
    const { viewModel: navigationVM } = useViewModel(NavigationViewModel);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAboutMyResults = () => {
        console.log("Handle About My Results");
    }

    const handleRetake = () => {
        console.log("Handle Retake");
    }

    const navigateToUltimateGoals = useCallback(() => {
        router.push(navigationVM.getRouteFor(FTUX_Routes.UltimateGoals));
    }, [navigationVM]);

    const validateAndSetDate = useCallback((newInputs: DateInputs) => {
        const { month, day, year } = newInputs;

        // Only attempt to create a date if all fields are filled
        if (month && day && year && year.length === 4) {
            const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const parsedDate = dayjs(dateString, STORAGE_FORMAT, true);

            if (parsedDate.isValid()) {
                setDate(parsedDate);
            } else {
                setDate(null);
            }
        } else {
            setDate(null);
        }
    }, []);

    const handleInputChange = useCallback((field: keyof DateInputs, value: string) => {
        // Remove any non-numeric characters
        const numericValue = value.replace(/[^0-9]/g, '');

        // Apply field-specific validation
        let validatedValue = numericValue;
        if (field === 'month') {
            validatedValue = numericValue.slice(0, 2);
            const num = parseInt(validatedValue);
            if (num > 12) validatedValue = '12';
        } else if (field === 'day') {
            validatedValue = numericValue.slice(0, 2);
            const num = parseInt(validatedValue);
            if (num > 31) validatedValue = '31';
        } else if (field === 'year') {
            validatedValue = numericValue.slice(0, 4);
        }

        const newInputs = { ...dateInputs, [field]: validatedValue };
        setDateInputs(newInputs);
        validateAndSetDate(newInputs);
    }, [dateInputs, validateAndSetDate]);

    const handleDatePickerChange = useCallback((params: { date: DateType }) => {
        if (params.date) {
            const newDate = dayjs(params.date);
            setDate(newDate);

            // Update the input fields
            setDateInputs({
                month: newDate.format('MM'),
                day: newDate.format('DD'),
                year: newDate.format('YYYY')
            });
        }
    }, []);

    const saveBirthDate = useCallback(async () => {
        if (!date) {
            return false;
        }

        console.log('Saving birth date:', date.format(STORAGE_FORMAT));

        // Update the user profile with the birth date
        try {
            const success = updateUserProfile({
                birth_date: date.toDate()
            });

            if (!success) {
                console.error('Failed to update user profile: No current profile exists');
                showErrorToast('Error', 'Failed to save birth date');
                return false;
            }

            console.log('Birth date saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving birth date:', error);
            showErrorToast('Error', 'Failed to save birth date');
            return false;
        }
    }, [date]);

    const handleContinue = useCallback(async () => {
        if (!date) {
            showErrorToast('Required', 'Must have a date to continue');
            return;
        }

        const success = await saveBirthDate();
        if (success) {
            navigateToUltimateGoals();
        }
    }, [date, navigateToUltimateGoals, saveBirthDate]);

    const handleNavigateToIndex = useCallback(() => {
        navigationVM.navigateToIndex();
    }, [navigationVM]);

    const handleSubmit = useCallback(async () => {
        if (!date) {
            showErrorToast('Required', 'Must have a date to continue');
            return;
        }

        setIsSubmitting(true);
        const success = await saveBirthDate();
        setIsSubmitting(false);

        if (success) {
            router.back();
        }

    }, [date, saveBirthDate, navigationVM]);

    const handleDone = useCallback(async () => {
        if (!date) {
            showErrorToast('Required', 'Must have a date to continue');
            return;
        }
        const success = await saveBirthDate();
        if (success) {
            router.push(navigationVM.getRouteFor(FTUX_Routes.IntroducingYou));
        }
    }, [date, saveBirthDate, navigationVM]);

    useEffect(() => {
        console.log('userProfile$.birth_date.get()', userProfile$.birth_date.get());
        const birthDate = userProfile$.birth_date.get();
        if (birthDate) {
            const parsedDate = dayjs(birthDate);
            if (parsedDate.isValid()) {
                setDateInputs({
                    month: parsedDate.format('MM'),
                    day: parsedDate.format('DD'),
                    year: parsedDate.format('YYYY')
                });
                validateAndSetDate({
                    month: parsedDate.format('MM'),
                    day: parsedDate.format('DD'),
                    year: parsedDate.format('YYYY')
                });
            }
        }
    }, [userProfile$.birth_date.get()]);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 75 : 75}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View flex padding-page style={{ backgroundColor: Colors.backgroundLight }}>
                    {/* <View row spread marginB-20>
                        <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.BirthDate)}>
                            <Text buttonRegular>
                                Back
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDone}>
                            <Text buttonRegular>
                                Done
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View center left br50 paddingH-8 paddingV-4 style={{ backgroundColor: customColors.beige2, width: 40 }}>
                        <Text labelText>2/9</Text>
                    </View> */}
                    {
                        !navigationVM.getIsMyData() ? (
                            <>
                                <View row spread marginB-20>
                                    <TouchableOpacity onPress={() => navigationVM.navigateToPreviousFTUXRoute(FTUX_Routes.UltimateGoals)}>
                                        <Text buttonRegular>
                                            Back
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleDone}>
                                        <Text buttonRegular>
                                            Done
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View center left br50 paddingH-8 paddingV-4 style={{ backgroundColor: customColors.beige2, width: 40 }}>
                                    <Text labelText>3/9</Text>
                                </View>
                            </>
                        ) : (
                            <View row spread marginB-s8>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={typography.bodyLBold}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSubmit}>
                                    <Text style={[typography.bodyLBold]}>
                                        Done
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )
                    }
                    <View left marginT-20>
                        <Text h2>What is your birthday?</Text>
                    </View>
                    <View left marginT-20>
                        <Text style={styles.inputHelper}>Enter your birth date</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <View row centerV>
                            <View style={styles.dateInputGroup}>
                                <TextField
                                    placeholder="MM"
                                    value={dateInputs.month}
                                    onChangeText={(value) => handleInputChange('month', value)}
                                    style={styles.dateInputSmall}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.dateInputSeparator}>-</Text>
                                <TextField
                                    placeholder="DD"
                                    value={dateInputs.day}
                                    onChangeText={(value) => handleInputChange('day', value)}
                                    style={styles.dateInputSmall}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.dateInputSeparator}>-</Text>
                                <TextField
                                    placeholder="YYYY"
                                    value={dateInputs.year}
                                    onChangeText={(value) => handleInputChange('year', value)}
                                    style={styles.dateInputYear}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                />
                            </View>
                        </View>
                    </View>

                    <View flex top>
                        <View>
                            <DateTimePicker
                                headerTextStyle={{
                                    color: '#000000',
                                    textDecorationLine: 'underline'
                                }}
                                mode="single"
                                date={date}
                                onChange={handleDatePickerChange}
                            />
                        </View>
                    </View>

                    {!navigationVM.getIsMyData() &&
                        <View style={styles.bottomContainer}>
                            <TouchableOpacity
                                style={[styles.doneButton, !date && styles.disabledButton]}
                                onPress={handleContinue}
                                disabled={!date}
                            >
                                <Text style={styles.doneButtonText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <View flex>
                                <TouchableOpacity
                                    onPress={navigateToUltimateGoals}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Text labelSecondary underline>
                                        Skip for now
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundLight,
    },
    scrollContainer: {
        flexGrow: 1,
        minHeight: '100%',
    },
    inputContainer: {
        marginTop: 16,
        marginBottom: 16,
    },
    dateInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 8,
    },
    dateInputSmall: {
        height: 48,
        width: 60,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        textAlign: 'center',
    },
    dateInputYear: {
        height: 48,
        width: 80,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        textAlign: 'center',
    },
    dateInputSeparator: {
        fontSize: 20,
        color: '#666666',
    },
    inputHelper: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
        marginLeft: 4,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
    },
    doneButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 24,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        opacity: 0.5,
    },
    doneButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default BirthDateScreen;
