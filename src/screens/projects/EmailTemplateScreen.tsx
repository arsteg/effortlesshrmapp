import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmailTemplateScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Email Template Screen</Text>
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

export default EmailTemplateScreen;
