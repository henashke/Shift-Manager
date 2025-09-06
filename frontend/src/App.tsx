import React, {useEffect, useState} from 'react';
import NotificationDisplay from './components/NotificationDisplay';
import {CssBaseline} from '@mui/material';
import {observer} from 'mobx-react-lite';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {Route, Routes, useNavigate} from 'react-router-dom';
import LoginSignup from './components/LoginSignup';
import authStore from './stores/AuthStore';
import ConstraintTab from './components/tabs/ConstraintTab';
import AssignmentTab from './components/tabs/AssignmentTab';
import SettingsTab from './components/tabs/SettingsTab';
import {AppBarComponent} from "./components/AppBarComponent";

const DARK_MODE_KEY = 'darkMode';

const App: React.FC = observer(() => {
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem(DARK_MODE_KEY);
        return savedMode ? JSON.parse(savedMode) : true;
    });

    useEffect(() => {
        localStorage.setItem(DARK_MODE_KEY, JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        authStore.ensureValidSession(navigate);
        if (!authStore.isAuthenticated() && window.location.pathname !== '/login') {
            navigate('/login');
        } else if (authStore.isAuthenticated() && window.location.pathname === '/login') {
            navigate('/');
        }
    }, [navigate]);

    const theme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: '#594db9',
            },
            background: {
                default: darkMode ? '#252529' : '#f5f5f5',
                paper: darkMode ? 'rgb(32,32,36)' : '#fff',
            },
        },
        direction: 'rtl',
        components: {
            MuiAppBar: {
                styleOverrides: {
                    colorPrimary: {
                        backgroundColor: '#594db9',
                        color: '#fff',
                    },
                },
            },
        },
        typography: {
            fontFamily: [
                'Inter',
                'Segoe UI',
                'Arial',
                'sans-serif',
            ].join(','),
        },
    });
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <AppBarComponent darkMode={darkMode} setDarkMode={setDarkMode}/>
            <Routes>
                <Route path="/login" element={<LoginSignup/>}/>
                <Route path="/constraints" element={<ConstraintTab/>}/>
                <Route path="/settings" element={<SettingsTab/>}/>
                <Route path="/" element={<AssignmentTab/>}/>
            </Routes>
            <NotificationDisplay/>
        </ThemeProvider>
    );
});

export default App;
