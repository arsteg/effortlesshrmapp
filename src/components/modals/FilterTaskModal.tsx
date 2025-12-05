import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';

const FilterTaskModal = () => {
    return (
        <Modal animationType="slide" transparent={true} visible={false}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text>Filter Task Modal</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default FilterTaskModal;
