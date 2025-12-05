import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AppsWebsiteScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Apps Website Screen</Text>
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

export default AppsWebsiteScreen;
