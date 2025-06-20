import React, {useState} from 'react';
import {Container, CssBaseline, IconButton, Typography, AppBar, Toolbar, Box, Menu, MenuItem, Tooltip} from '@mui/material';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from './components/CalendarNavigation';
import ShiftTable from './components/ShiftTable';
import KonanList from './components/KonanList';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {DarkMode, LightMode} from '@mui/icons-material';
import LoginIcon from '@mui/icons-material/Login';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginSignup from './components/LoginSignup';
import authStore from './stores/AuthStore';
import LogoutDialog from './components/dialogs/LogoutDialog';

const App: React.FC = observer(() => {
    const [darkMode, setDarkMode] = useState(true);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);
    const navigate = useNavigate();

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
            <AppBar position="static" color="primary" sx={{mb: 4}}>
                <Toolbar sx={{justifyContent: 'space-between'}}>
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <Typography variant="h5" fontWeight={800} color="inherit" sx={{textShadow: '0 2px 16px #222a, 0 1px 0 #2228'}}>
                            כוננים
                        </Typography>
                        <IconButton
                            aria-label="toggle theme"
                            onClick={() => setDarkMode((prev) => !prev)}
                            sx={{ml: 2, verticalAlign: 'middle'}}
                            size="large"
                        >
                            {darkMode ? <LightMode sx={{color: '#ffe066'}}/> : <DarkMode sx={{color: '#23272f'}}/>}
                        </IconButton>
                    </Box>
                    {!authStore.username && (
                        <IconButton aria-label="login" color="inherit" onClick={() => navigate('/login')}>
                            <LoginIcon/>
                        </IconButton>
                    )}
                    {authStore.username && (
                        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                            <Tooltip title="אפשרויות משתמש">
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                        textDecorationColor: 'transparent',
                                        transition: 'text-decoration-color 0.2s',
                                        '&:hover': {
                                            textDecorationColor: '#61dafb',
                                        },
                                    }}
                                    onClick={e => setAnchorEl(e.currentTarget)}
                                >
                                    {`שלום, ${authStore.username}`}
                                </Typography>
                            </Tooltip>
                            <Menu
                                anchorEl={anchorEl}
                                open={menuOpen}
                                onClose={() => setAnchorEl(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            >
                                <MenuItem onClick={() => { setAnchorEl(null); setLogoutOpen(true); }}>יציאה</MenuItem>
                            </Menu>
                        </Box>
                    )}
                    <LogoutDialog
                        open={logoutOpen}
                        onClose={() => setLogoutOpen(false)}
                        onLogout={() => {
                            authStore.logout();
                            setLogoutOpen(false);
                        }}
                        username={authStore.username || ''}
                    />
                </Toolbar>
            </AppBar>
            <Routes>
                <Route path="/login" element={<LoginSignup />} />
                <Route path="/" element={
                    <Container maxWidth="lg" dir="rtl">
                        <CalendarNavigation/>
                        <ShiftTable/>
                        <KonanList/>
                    </Container>
                } />
            </Routes>
        </ThemeProvider>
    );
});

export default App;
