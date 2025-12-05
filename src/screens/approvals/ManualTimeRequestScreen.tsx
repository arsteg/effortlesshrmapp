import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ManualTimeRequestScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Manual Time Request Screen</Text>
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

export default ManualTimeRequestScreen;
