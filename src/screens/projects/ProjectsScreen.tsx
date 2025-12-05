import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProjectsScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Projects Screen</Text>
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

export default ProjectsScreen;
