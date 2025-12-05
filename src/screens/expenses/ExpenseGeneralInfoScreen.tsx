import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ExpenseGeneralInfoScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Expense General Info Screen</Text>
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

export default ExpenseGeneralInfoScreen;
