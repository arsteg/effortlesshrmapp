import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { theme } from '../../theme';

interface FAQItem {
    question: string;
    answer: string;
}

export const HelpScreen = () => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const faqs: FAQItem[] = [
        {
            question: 'How do I clock in/out?',
            answer: 'Navigate to the Attendance screen from the menu and tap the Clock In/Out button. Your location and time will be recorded automatically.',
        },
        {
            question: 'How do I apply for leave?',
            answer: 'Go to Leaves > Apply Leave, select the leave type, dates, and provide a reason. Your manager will be notified for approval.',
        },
        {
            question: 'How do I submit an expense?',
            answer: 'Navigate to Expenses > Add Expense, fill in the details, attach receipts if needed, and submit for approval.',
        },
        {
            question: 'How do I view my payslips?',
            answer: 'Go to Payroll > Payslips to view and download your monthly payslips.',
        },
        {
            question: 'How do I update my profile?',
            answer: 'Go to Settings > Profile to update your personal information, profile picture, and contact details.',
        },
        {
            question: 'How do I change my password?',
            answer: 'Navigate to Settings > Change Password, enter your current password and new password, then save.',
        },
        {
            question: 'How do I view my work reports?',
            answer: 'Access various reports from the Reports menu including Activity Level, Productivity, Screenshots, and Timeline reports.',
        },
        {
            question: 'What if I forget to clock out?',
            answer: 'Contact your manager or HR to manually adjust your attendance record. You can also submit a manual time entry request.',
        },
    ];

    const toggleFAQ = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@effortlesshrm.com?subject=Support Request');
    };

    const handleCallSupport = () => {
        Linking.openURL('tel:+1234567890');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={theme.colors.primary} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Contact Support Card */}
                <Card style={styles.contactCard}>
                    <Text style={styles.cardTitle}>Need Help?</Text>
                    <Text style={styles.cardSubtitle}>
                        Our support team is here to assist you
                    </Text>

                    <View style={styles.contactButtons}>
                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={handleContactSupport}
                        >
                            <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
                            <Text style={styles.contactButtonText}>Email Support</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={handleCallSupport}
                        >
                            <Ionicons name="call-outline" size={24} color={theme.colors.primary} />
                            <Text style={styles.contactButtonText}>Call Support</Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* FAQs */}
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                {faqs.map((faq, index) => (
                    <Card key={index} style={styles.faqCard}>
                        <TouchableOpacity
                            style={styles.faqHeader}
                            onPress={() => toggleFAQ(index)}
                        >
                            <Text style={styles.faqQuestion}>{faq.question}</Text>
                            <Ionicons
                                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={theme.colors.gray600}
                            />
                        </TouchableOpacity>
                        {expandedIndex === index && (
                            <View style={styles.faqAnswer}>
                                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                            </View>
                        )}
                    </Card>
                ))}

                {/* Quick Links */}
                <Text style={styles.sectionTitle}>Quick Links</Text>
                <Card style={styles.linksCard}>
                    <TouchableOpacity style={styles.linkItem}>
                        <Ionicons name="document-text-outline" size={24} color={theme.colors.gray600} />
                        <Text style={styles.linkText}>User Guide</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.linkItem, styles.linkItemBorder]}>
                        <Ionicons name="videocam-outline" size={24} color={theme.colors.gray600} />
                        <Text style={styles.linkText}>Video Tutorials</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.linkItem, styles.linkItemBorder]}>
                        <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.gray600} />
                        <Text style={styles.linkText}>Community Forum</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
                    </TouchableOpacity>
                </Card>

                {/* App Info */}
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>App Version:</Text>
                        <Text style={styles.infoValue}>1.0.0</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Last Updated:</Text>
                        <Text style={styles.infoValue}>December 2024</Text>
                    </View>
                </Card>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    scrollContent: {
        padding: theme.spacing.md,
    },
    contactCard: {
        marginBottom: theme.spacing.md,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    cardSubtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
    },
    contactButtons: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        width: '100%',
    },
    contactButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.secondary,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    contactButtonText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.textPrimary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    faqCard: {
        marginBottom: theme.spacing.sm,
        padding: 0,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    faqQuestion: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.textPrimary,
        marginRight: theme.spacing.sm,
    },
    faqAnswer: {
        padding: theme.spacing.md,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray200,
    },
    faqAnswerText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    linksCard: {
        marginBottom: theme.spacing.md,
        padding: 0,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        gap: theme.spacing.md,
    },
    linkItemBorder: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray200,
    },
    linkText: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textPrimary,
    },
    infoCard: {
        marginBottom: theme.spacing.xl,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray200,
    },
    infoLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    infoValue: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textPrimary,
        fontWeight: theme.typography.fontWeight.medium,
    },
});
