import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScreenshotScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Screenshot Screen</Text>
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

export default ScreenshotScreen;
