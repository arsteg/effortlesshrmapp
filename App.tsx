import React from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
// TODO: Re-enable when backend communication service is ready
// import { CommunicationProvider } from './src/components/CommunicationProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        {/* TODO: Re-enable CommunicationProvider when backend is ready */}
        <AppNavigator />
      </Provider>
    </GestureHandlerRootView>
  );
}
