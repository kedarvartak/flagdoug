import { Dashboard } from './pages/Dashboard';
import { ThemeProvider, FlagsProvider, ToastProvider } from './context';
import './App.css';

function App() {
  console.log('App component rendering');
  return (
    <ThemeProvider>
      <ToastProvider>
        <FlagsProvider initialPage={1} pageSize={10}>
          <Dashboard />
        </FlagsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
