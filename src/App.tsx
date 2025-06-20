import React, {useState} from 'react';
import {Container, CssBaseline, IconButton, Typography, AppBar, Toolbar, Box} from '@mui/material';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from './components/CalendarNavigation';
import ShiftTable from './components/ShiftTable';
import EmployeeList from './components/EmployeeList';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {DarkMode, LightMode} from '@mui/icons-material';
import LoginIcon from '@mui/icons-material/Login';

const App: React.FC = observer(() => {
    const [darkMode, setDarkMode] = useState(true);

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
                    <IconButton aria-label="login" color="inherit">
                        <LoginIcon/>
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" dir="rtl">
                <CalendarNavigation/>
                <ShiftTable/>
                <EmployeeList/>
            </Container>
        </ThemeProvider>
    );
});

export default App;
