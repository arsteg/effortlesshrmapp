import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProductivityReportScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Productivity Report Screen</Text>
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

export default ProductivityReportScreen;
