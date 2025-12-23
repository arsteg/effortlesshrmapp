import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../../theme';
import { leaveService } from '../../services/leaveService';
import { Loading } from '../../components/common/Loading';
import { useAppSelector } from '../../store/hooks';

export const ApplyLeaveScreen = ({ navigation }: any) => {
    const { user } = useAppSelector((state) => state.auth);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        leaveTypeId: '',
        fromDate: new Date(),
        toDate: new Date(),
        reason: '',
        dayType: 'Full Day', // 'Full Day' | 'Half Day'
    });

    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    useEffect(() => {
        loadLeaveTypes();
    }, []);

    const loadLeaveTypes = async () => {
        setLoading(true);
        try {
            if (user?.id) {
                // Assuming getLeaveTypes exists or using existing method
                const res = await leaveService.getLeaveCategoriesByUser(user.id);
                // API likely returns { data: [...] }
                const types = res.data || res || [];
                setLeaveTypes(types);
                if (types && types.length > 0) {
                    setForm(prev => ({ ...prev, leaveTypeId: types[0].id }));
                }
            }
        } catch (error) {
            console.error('Failed to load leave types', error);
            Alert.alert('Error', 'Could not load leave types');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date, field?: 'from' | 'to') => {
        if (field === 'from') setShowFromPicker(Platform.OS === 'ios');
        if (field === 'to') setShowToPicker(Platform.OS === 'ios');

        if (selectedDate && field === 'from') {
            setForm(prev => ({ ...prev, fromDate: selectedDate }));
        }
        if (selectedDate && field === 'to') {
            setForm(prev => ({ ...prev, toDate: selectedDate }));
        }
    };

    const handleSubmit = async () => {
        if (!form.leaveTypeId || !form.reason) {
            Alert.alert('Validation Error', 'Please select a leave type and provide a reason.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                userId: user?.id,
                leaveCategoryId: form.leaveTypeId,
                fromDate: form.fromDate.toISOString(),
                toDate: form.toDate.toISOString(),
                reason: form.reason,
                dayType: form.dayType,
            };

            await leaveService.addLeaveApplication(payload);
            Alert.alert('Success', 'Leave application submitted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Apply leave failed', error);
            Alert.alert('Error', 'Failed to submit leave application');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading message="Loading leave types..." />;

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Leave Type</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={form.leaveTypeId}
                            onValueChange={(itemValue) => setForm({ ...form, leaveTypeId: itemValue })}
                        >
                            {leaveTypes.map((type) => (
                                <Picker.Item key={type.id} label={type.name} value={type.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.dateRow}>
                    <View style={styles.dateGroup}>
                        <Text style={styles.label}>From Date</Text>
                        <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateInput}>
                            <Text>{form.fromDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showFromPicker && (
                            <DateTimePicker
                                value={form.fromDate}
                                mode="date"
                                display="default"
                                onChange={(e, date) => handleDateChange(e, date, 'from')}
                            />
                        )}
                    </View>
                    <View style={styles.dateGroup}>
                        <Text style={styles.label}>To Date</Text>
                        <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.dateInput}>
                            <Text>{form.toDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showToPicker && (
                            <DateTimePicker
                                value={form.toDate}
                                mode="date"
                                display="default"
                                onChange={(e, date) => handleDateChange(e, date, 'to')}
                            />
                        )}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Day Type</Text>
                    <View style={styles.radioGroup}>
                        {['Full Day', 'Half Day'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.radioButton, form.dayType === type && styles.radioButtonSelected]}
                                onPress={() => setForm({ ...form, dayType: type })}
                            >
                                <Text style={[styles.radioText, form.dayType === type && styles.radioTextSelected]}>
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Reason</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        numberOfLines={4}
                        placeholder="Enter reason for leave"
                        value={form.reason}
                        onChangeText={(text) => setForm({ ...form, reason: text })}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Apply Leave'}</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    content: {
        padding: theme.spacing.md,
    },
    formGroup: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    pickerContainer: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    dateGroup: {
        flex: 0.48,
    },
    dateInput: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        alignItems: 'center',
    },
    radioGroup: {
        flexDirection: 'row',
    },
    radioButton: {
        flex: 1,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        alignItems: 'center',
        marginRight: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
    },
    radioButtonSelected: {
        backgroundColor: theme.colors.primary,
    },
    radioText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    radioTextSelected: {
        color: theme.colors.white,
    },
    input: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.gray300,
        fontSize: theme.typography.fontSize.md,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    submitButtonDisabled: {
        backgroundColor: theme.colors.gray400,
    },
    submitButtonText: {
        color: theme.colors.white,
        fontWeight: 'bold',
        fontSize: theme.typography.fontSize.lg,
    },
});
