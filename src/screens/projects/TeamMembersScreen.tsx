import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TeamMembersScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Team Members Screen</Text>
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

export default TeamMembersScreen;
