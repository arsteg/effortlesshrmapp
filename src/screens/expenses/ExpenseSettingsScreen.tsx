import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExpenseSettingsScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Expense Settings Screen</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ExpenseSettingsScreen;
