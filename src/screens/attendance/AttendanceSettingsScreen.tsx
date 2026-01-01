import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Switch,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { attendanceService, OfficeData, AttendanceRuleData } from '../../services/attendanceService';
import { theme } from '../../theme';
import { useLocation } from '../../hooks/useLocation';
import { KeyboardAvoidingView, Platform } from 'react-native';

interface Office extends OfficeData {
    _id: string;
}

const AttendanceSettingsScreen = () => {
    const { getCurrentLocation } = useLocation();
    const [offices, setOffices] = useState<Office[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [rulesModalVisible, setRulesModalVisible] = useState(false);
    const [editingOffice, setEditingOffice] = useState<Office | null>(null);
    const [officeForm, setOfficeForm] = useState<OfficeData>({
        name: '',
        latitude: 0,
        longitude: 0,
        geofence_radius: 100
    });
    const [currentRules, setCurrentRules] = useState<AttendanceRuleData | null>(null);

    const fetchOffices = useCallback(async () => {
        try {
            setLoading(true);
            const response = await attendanceService.getOffices();
            if (response.status?.toLowerCase() === 'success') {
                setOffices(response.data.offices || []);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch offices');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOffices();
    }, [fetchOffices]);

    const handleGetLocation = async () => {
        setActionLoading(true);
        try {
            const loc = await getCurrentLocation();
            if (loc) {
                setOfficeForm(prev => ({
                    ...prev,
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude
                }));
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to get current location');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveOffice = async () => {
        if (!officeForm.name || officeForm.latitude === 0 || officeForm.longitude === 0) {
            Alert.alert('Error', 'Please fill all fields with valid coordinates');
            return;
        }

        try {
            setActionLoading(true);
            let response: any;
            if (editingOffice) {
                response = await attendanceService.updateOffice(editingOffice._id, officeForm);
            } else {
                response = await attendanceService.createOffice(officeForm);
            }

            if (response.status?.toLowerCase() === 'success') {
                Alert.alert('Success', `Office ${editingOffice ? 'updated' : 'created'} successfully`);
                setModalVisible(false);
                fetchOffices();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save office');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteOffice = (id: string) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this office and its rules?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response: any = await attendanceService.deleteOffice(id);
                            if (response.status?.toLowerCase() === 'success' || response.status === undefined) {
                                Alert.alert('Success', 'Office deleted');
                                fetchOffices();
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete office');
                        }
                    }
                }
            ]
        );
    };

    const openRulesModal = async (officeId: string) => {
        try {
            setLoading(true);
            const response: any = await attendanceService.getRulesByOffice(officeId);
            if (response.status?.toLowerCase() === 'success') {
                setCurrentRules(response.data.rules);
                setRulesModalVisible(true);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch rules');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRules = async () => {
        if (!currentRules) return;

        try {
            setActionLoading(true);
            const response: any = await attendanceService.updateRules(currentRules);
            if (response.status?.toLowerCase() === 'success') {
                Alert.alert('Success', 'Rules updated successfully');
                setRulesModalVisible(false);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update rules');
        } finally {
            setActionLoading(false);
        }
    };

    const renderOfficeItem = ({ item }: { item: Office }) => (
        <View style={styles.officeCard}>
            <View style={styles.officeInfo}>
                <Text style={styles.officeName}>{item.name}</Text>
                <Text style={styles.officeCoords}>
                    {item.location?.coordinates[0].toFixed(6)}, {item.location?.coordinates[1]?.toFixed(6)}
                </Text>
                <Text style={styles.officeDetails}>
                    Radius: {item.geofence_radius}m
                </Text>
            </View>
            <View style={styles.officeActions}>
                <TouchableOpacity
                    onPress={() => {
                        setEditingOffice(item);
                        setOfficeForm({
                            name: item.name,
                            latitude: item.latitude,
                            longitude: item.longitude,
                            geofence_radius: item.geofence_radius
                        });
                        setModalVisible(true);
                    }}
                    style={styles.actionButton}
                >
                    <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openRulesModal(item._id)} style={styles.actionButton}>
                    <Ionicons name="settings-outline" size={20} color={theme.colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteOffice(item._id)} style={styles.actionButton}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Office Management</Text>
                    <Text style={styles.subtitle}>{offices.length} offices configured</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setEditingOffice(null);
                        setOfficeForm({ name: '', latitude: 0, longitude: 0, geofence_radius: 100 });
                        setModalVisible(true);
                    }}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading && offices.length === 0 ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={offices}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOfficeItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="business-outline" size={64} color={theme.colors.gray300} />
                            <Text style={styles.emptyText}>No offices configured yet.</Text>
                            <Text style={styles.emptySubtext}>Tap the + button to add your first office.</Text>
                        </View>
                    }
                />
            )}

            {/* Office Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingOffice ? 'Edit' : 'Add'} Office</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.gray600} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.inputLabel}>Office Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Main Headquarters"
                                value={officeForm.name}
                                onChangeText={(text) => setOfficeForm({ ...officeForm, name: text })}
                            />

                            <View style={styles.coordHeader}>
                                <Text style={styles.inputLabel}>Location Coordinates</Text>
                                <TouchableOpacity style={styles.getLocationBtn} onPress={handleGetLocation}>
                                    <Ionicons name="locate" size={16} color={theme.colors.primary} />
                                    <Text style={styles.getLocationText}>Get Current</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.subLabel}>Latitude</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.0000"
                                        keyboardType="numeric"
                                        value={officeForm.latitude.toString()}
                                        onChangeText={(text) => setOfficeForm({ ...officeForm, latitude: parseFloat(text) || 0 })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.subLabel}>Longitude</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0.0000"
                                        keyboardType="numeric"
                                        value={officeForm.longitude.toString()}
                                        onChangeText={(text) => setOfficeForm({ ...officeForm, longitude: parseFloat(text) || 0 })}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Geofence Radius (meters)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="100"
                                keyboardType="numeric"
                                value={officeForm.geofence_radius.toString()}
                                onChangeText={(text) => setOfficeForm({ ...officeForm, geofence_radius: parseInt(text) || 0 })}
                            />

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={[styles.saveButton, actionLoading && { opacity: 0.7 }]}
                                    onPress={handleSaveOffice}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save Office</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Rules Modal */}
            <Modal visible={rulesModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Office Attendance Rules</Text>
                        {currentRules && (
                            <ScrollView>
                                <View style={styles.ruleItem}>
                                    <Text>Selfie Required</Text>
                                    <Switch
                                        value={currentRules.selfie_required}
                                        onValueChange={(val) => setCurrentRules({ ...currentRules, selfie_required: val })}
                                    />
                                </View>
                                <View style={styles.ruleItem}>
                                    <Text>Face Recognition</Text>
                                    <Switch
                                        value={currentRules.face_recognition_enabled}
                                        onValueChange={(val) => setCurrentRules({ ...currentRules, face_recognition_enabled: val })}
                                    />
                                </View>
                                <Text style={styles.label}>Face Match Threshold (%)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={currentRules.face_match_threshold.toString()}
                                    onChangeText={(text) => setCurrentRules({ ...currentRules, face_match_threshold: parseInt(text) || 0 })}
                                />
                            </ScrollView>
                        )}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setRulesModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveRules}>
                                <Text style={styles.saveButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.gray50 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', color: theme.colors.gray900 },
    addButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center'
    },
    addButtonText: { color: '#fff', marginLeft: 5, fontWeight: '600' },
    listContent: { padding: 15 },
    officeCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...theme.shadows.small
    },
    officeInfo: { flex: 1 },
    officeName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.gray800 },
    officeCoords: { fontSize: 13, color: theme.colors.gray600, marginTop: 4, fontWeight: '500' },
    officeDetails: { fontSize: 12, color: theme.colors.gray400, marginTop: 2 },
    officeActions: { flexDirection: 'row' },
    actionButton: { padding: 8, marginLeft: 8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, padding: 20 },
    emptyText: { textAlign: 'center', marginTop: 16, color: theme.colors.gray600, fontSize: 16, fontWeight: 'bold' },
    emptySubtext: { textAlign: 'center', marginTop: 8, color: theme.colors.gray400, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.gray900 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.gray700, marginBottom: 8 },
    subLabel: { fontSize: 12, color: theme.colors.gray500, marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.gray200,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: theme.colors.gray50
    },
    coordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    getLocationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    getLocationText: { marginLeft: 4, fontSize: 12, fontWeight: 'bold', color: theme.colors.primary },
    row: { flexDirection: 'row', marginBottom: 8 },
    modalFooter: { marginTop: 24, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
    cancelButton: { padding: 12, marginRight: 10 },
    cancelButtonText: { color: theme.colors.gray600, fontWeight: '600' },
    saveButton: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', width: '100%' },
    saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    ruleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.gray100 },
    label: { marginTop: 15, marginBottom: 5, color: theme.colors.gray600, fontWeight: '600' },
    subtitle: { fontSize: 14, color: theme.colors.gray500, marginTop: 2 }
});

export default AttendanceSettingsScreen;
