import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TimesheetScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Timesheet Screen</Text>
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

export default TimesheetScreen;
