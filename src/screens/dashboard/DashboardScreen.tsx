import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';

export const DashboardScreen = () => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000); // fake refresh
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.value}>This is a minimal dashboard screen.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Today’s Time</Text>
          <Text style={styles.value}>2h 30m</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Weekly Summary</Text>
          <Text style={styles.value}>12h 10m</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Monthly Summary</Text>
          <Text style={styles.value}>52h 45m</Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
});
