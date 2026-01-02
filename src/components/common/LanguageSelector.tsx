import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface LanguageSelectorProps {
    visible: boolean;
    onClose: () => void;
}

const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ visible, onClose }) => {
    const { i18n, t } = useTranslation();

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>{t('common.select')} Language</Text>
                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            style={[
                                styles.langItem,
                                i18n.language === lang.code && styles.activeLangItem,
                            ]}
                            onPress={() => changeLanguage(lang.code)}
                        >
                            <View>
                                <Text style={[
                                    styles.langName,
                                    i18n.language === lang.code && styles.activeLangText
                                ]}>
                                    {lang.name}
                                </Text>
                                <Text style={styles.nativeName}>{lang.nativeName}</Text>
                            </View>
                            {i18n.language === lang.code && (
                                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '80%',
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.gray900,
        marginBottom: 20,
        textAlign: 'center',
    },
    langItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#F9FAFB',
    },
    activeLangItem: {
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    langName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.gray900,
    },
    activeLangText: {
        color: theme.colors.primary,
    },
    nativeName: {
        fontSize: 12,
        color: theme.colors.gray500,
        marginTop: 2,
    },
    closeButton: {
        marginTop: 10,
        padding: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.gray500,
    },
});

export default LanguageSelector;
