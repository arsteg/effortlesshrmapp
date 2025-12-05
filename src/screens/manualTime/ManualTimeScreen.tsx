import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ManualTimeScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Manual Time Screen</Text>
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

export default ManualTimeScreen;
