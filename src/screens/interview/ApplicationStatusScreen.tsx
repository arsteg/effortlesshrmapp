import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ApplicationStatusScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Application Status Screen</Text>
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

export default ApplicationStatusScreen;
