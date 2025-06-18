import React, {useState} from 'react';
import {Container, CssBaseline, IconButton, Typography} from '@mui/material';
import {observer} from 'mobx-react-lite';
import CalendarNavigation from './components/CalendarNavigation';
import ShiftTable from './components/ShiftTable';
import EmployeeList from './components/EmployeeList';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import {DarkMode, LightMode} from '@mui/icons-material';

const App: React.FC = observer(() => {
    const [darkMode, setDarkMode] = useState(true);

    const theme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: '#61dafb',
            },
            background: {
                default: darkMode ? '#252529' : '#f5f5f5',
                paper: darkMode ? 'rgb(32,32,36)' : '#fff',
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
            <Container maxWidth="lg" sx={{pt: 5}} dir="rtl">
                <Typography variant="h3" fontWeight={800} color="primary" gutterBottom align="center"
                            sx={{textShadow: '0 2px 16px #222a, 0 1px 0 #2228'}}>
                    כוננים
                    <IconButton
                        aria-label="toggle theme"
                        onClick={() => setDarkMode((prev) => !prev)}
                        sx={{ml: 2, verticalAlign: 'middle'}}
                        size="large"
                    >
                        {darkMode ? <LightMode sx={{color: '#ffe066'}}/> : <DarkMode sx={{color: '#23272f'}}/>}
                    </IconButton>
                </Typography>
                <CalendarNavigation/>
                <ShiftTable/>
                <EmployeeList/>
            </Container>
        </ThemeProvider>
    );
});

export default App;

