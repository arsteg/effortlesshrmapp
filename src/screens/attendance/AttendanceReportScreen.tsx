
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { attendanceService } from '../../services/attendanceService';
import { theme } from '../../theme';

const AttendanceReportScreen = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [offices, setOffices] = useState<any[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<string | null>(null);

    // Date State
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    useEffect(() => {
        loadOffices();
    }, []);

    const loadOffices = async () => {
        try {
            const response: any = await attendanceService.getOffices();
            if (response.status?.toLowerCase() === 'success') {
                const officeList = response.data?.offices || [];
                setOffices(officeList);
                if (officeList.length > 0) {
                    setSelectedOffice(officeList[0]._id);
                }
            }
        } catch (error) {
            console.error('Failed to load offices', error);
        }
    };

    const fetchReport = async () => {
        if (!selectedOffice) {
            Alert.alert('Error', 'Please select an office');
            return;
        }

        setLoading(true);
        try {
            const response: any = await attendanceService.getAttendanceReport({
                officeId: selectedOffice,
                fromDate: fromDate.toISOString().split('T')[0],
                toDate: toDate.toISOString().split('T')[0]
            });

            if (response.status?.toLowerCase() === 'success') {
                setReportData(response.data?.report || []);
            } else {
                setReportData([]);
            }
        } catch (error) {
            console.error('Failed to fetch report', error);
            Alert.alert('Error', 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '--:--';
        return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (ms: number) => {
        if (!ms) return '-';
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.row}>
            <View style={styles.cellName}>
                <Text style={styles.nameText}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={styles.cellTime}>
                <Text style={styles.timeLabel}>In</Text>
                <Text style={styles.timeValue}>{formatTime(item.inTime)}</Text>
            </View>
            <View style={styles.cellTime}>
                <Text style={styles.timeLabel}>Out</Text>
                <Text style={styles.timeValue}>{formatTime(item.outTime)}</Text>
            </View>
            <View style={styles.cellTotal}>
                <Text style={styles.totalValue}>{formatDuration(item.totalTimeMs)}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.gray900} />
                </TouchableOpacity>
                <Text style={styles.title}>Attendance Report</Text>
                <TouchableOpacity onPress={fetchReport} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                <Text style={styles.label}>Select Office</Text>
                <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={offices}
                    labelField="name"
                    valueField="_id"
                    placeholder="Select Office"
                    value={selectedOffice}
                    onChange={(item) => setSelectedOffice(item._id)}
                />

                <View style={styles.dateRow}>
                    <View style={styles.dateInput}>
                        <Text style={styles.label}>From Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowFromPicker(true)}
                        >
                            <Text>{fromDate.toLocaleDateString()}</Text>
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.dateInput}>
                        <Text style={styles.label}>To Date</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowToPicker(true)}
                        >
                            <Text>{toDate.toLocaleDateString()}</Text>
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {(showFromPicker || showToPicker) && (
                    <DateTimePicker
                        value={showFromPicker ? fromDate : toDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            if (Platform.OS === 'android') {
                                setShowFromPicker(false);
                                setShowToPicker(false);
                            }
                            if (selectedDate) {
                                if (showFromPicker) {
                                    setFromDate(selectedDate);
                                    if (Platform.OS === 'ios') setShowFromPicker(false);
                                } else {
                                    setToDate(selectedDate);
                                    if (Platform.OS === 'ios') setShowToPicker(false);
                                }
                            }
                        }}
                    />
                )}

                <TouchableOpacity style={styles.searchButton} onPress={fetchReport}>
                    <Text style={styles.searchButtonText}>Generate Report</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listHeader}>
                <Text style={[styles.headerCell, { flex: 2 }]}>Employee</Text>
                <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>In</Text>
                <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Out</Text>
                <Text style={[styles.headerCell, { flex: 1, textAlign: 'right' }]}>Total</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={reportData}
                    keyExtractor={(item, index) => `${item.userId}-${item.date}-${index}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>No records found for the selected criteria.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.gray50 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent: 'space-between' },
    backButton: { marginRight: 15 },
    title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.gray900, flex: 1 },
    refreshButton: { padding: 5 },
    filterContainer: { padding: 20, backgroundColor: '#fff', margin: 15, borderRadius: 12, ...theme.shadows.small },
    label: { fontSize: 13, color: theme.colors.gray600, marginBottom: 5, fontWeight: '600' },
    dropdown: { height: 50, borderColor: theme.colors.gray200, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginBottom: 15 },
    placeholderStyle: { fontSize: 14, color: theme.colors.gray500 },
    selectedTextStyle: { fontSize: 14, color: theme.colors.gray900 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    dateInput: { flex: 0.48 },
    dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.gray200, padding: 10, borderRadius: 8 },
    searchButton: { backgroundColor: theme.colors.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
    searchButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    listHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.gray100 },
    headerCell: { fontSize: 12, fontWeight: 'bold', color: theme.colors.gray600 },
    listContent: { padding: 15 },
    row: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 8, alignItems: 'center', ...theme.shadows.small },
    cellName: { flex: 2 },
    nameText: { fontSize: 14, fontWeight: 'bold', color: theme.colors.gray800 },
    dateText: { fontSize: 12, color: theme.colors.gray500, marginTop: 2 },
    cellTime: { flex: 1, alignItems: 'center' },
    timeLabel: { fontSize: 10, color: theme.colors.gray400 },
    timeValue: { fontSize: 13, color: theme.colors.gray800, fontWeight: '500' },
    cellTotal: { flex: 1, alignItems: 'flex-end' },
    totalValue: { fontSize: 13, fontWeight: 'bold', color: theme.colors.success },
    centerContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: theme.colors.gray500 }
});

export default AttendanceReportScreen;
