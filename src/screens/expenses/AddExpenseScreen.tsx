import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../../theme';
import { expenseService } from '../../services/expenseService';
import { Loading } from '../../components/common/Loading';
import { useAppSelector } from '../../store/hooks';
import { Ionicons } from '@expo/vector-icons';

export const AddExpenseScreen = ({ navigation }: any) => {
  const { user } = useAppSelector((state) => state.auth);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    categoryId: '',
    amount: '',
    date: new Date(),
    description: '',
    receipt: null as ImagePicker.ImagePickerAsset | null,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await expenseService.getAllExpenseCategories();
      setCategories(data || []);
      if (data && data.length > 0) {
        setForm(prev => ({ ...prev, categoryId: data[0].id }));
      }
    } catch (error) {
      console.error('Failed to load expense categories', error);
      Alert.alert('Error', 'Could not load expense categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setForm(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const pickImage = async () => {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm({ ...form, receipt: result.assets[0] });
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.categoryId) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('UserId', user?.id || '');
      formData.append('Title', form.title);
      formData.append('Amount', form.amount);
      formData.append('ExpenseCategoryId', form.categoryId);
      formData.append('ExpenseDate', form.date.toISOString());
      formData.append('Description', form.description);

      if (form.receipt) {
        // @ts-ignore: FormData expects specific object shape for files in RN
        formData.append('Receipt', {
          uri: form.receipt.uri,
          name: 'receipt.jpg', // You might want to extract actual name
          type: 'image/jpeg',
        });
      }

      await expenseService.addExpenseReport(formData);
      Alert.alert('Success', 'Expense submitted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Add expense failed', error);
      Alert.alert('Error', 'Failed to submit expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading categories..." />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Expense Title"
            value={form.title}
            onChangeText={(text) => setForm({ ...form, title: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.categoryId}
              onValueChange={(itemValue) => setForm({ ...form, categoryId: itemValue })}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.categoryDesc} value={cat.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={form.amount}
            onChangeText={(text) => setForm({ ...form, amount: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
            <Text>{form.date.toLocaleDateString()}</Text>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.gray600} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={form.date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            placeholder="Optional description"
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Receipt</Text>
          <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
            <Ionicons name="camera-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.uploadText}>{form.receipt ? 'Change Receipt' : 'Upload Receipt'}</Text>
          </TouchableOpacity>
          {form.receipt && (
            <Image source={{ uri: form.receipt.uri }} style={styles.receiptPreview} />
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>{submitting ? 'Submitting...' : 'Submit Expense'}</Text>
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
  input: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    fontSize: theme.typography.fontSize.md,
  },
  pickerContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
  },
  dateInput: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    resizeMode: 'cover',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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
