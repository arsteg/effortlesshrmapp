import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CandidateDataFieldScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Candidate Data Field Screen</Text>
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

export default CandidateDataFieldScreen;
