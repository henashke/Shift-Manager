import React, {useState} from 'react';
import {Button, Container, CssBaseline, IconButton, Stack, Typography} from '@mui/material';
import {observer} from 'mobx-react-lite';
import CalendarNav from './components/CalendarNav';
import ShiftTable from './components/ShiftTable';
import EmployeeList from './components/EmployeeList';
import {createTheme, ThemeProvider} from '@mui/material/styles';
import AddEmployeeDialog from './components/AddEmployeeDialog';
import {DarkMode, LightMode} from '@mui/icons-material';

const App: React.FC = observer(() => {
  const [darkMode, setDarkMode] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#61dafb',
      },
      background: {
        default: darkMode ? '#232526' : '#f5f5f5',
        paper: darkMode ? 'rgba(34,34,34,0.95)' : '#fff',
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
      <CssBaseline />
      <Container maxWidth="lg" sx={{ pt: 5 }}>
        <Typography variant="h3" fontWeight={800} color="primary" gutterBottom align="center" sx={{ textShadow: '0 2px 16px #222a, 0 1px 0 #2228' }}>
          Shift Manager
          <IconButton
            aria-label="toggle theme"
            onClick={() => setDarkMode((prev) => !prev)}
            sx={{ ml: 2, verticalAlign: 'middle' }}
            size="large"
          >
            {darkMode ? <LightMode sx={{ color: '#ffe066' }} /> : <DarkMode sx={{ color: '#23272f' }} />}
          </IconButton>
        </Typography>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" onClick={() => setAddDialogOpen(true)}>
            Add Employee
          </Button>
        </Stack>
        <CalendarNav />
        <ShiftTable />
        <EmployeeList />
        <AddEmployeeDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
      </Container>
    </ThemeProvider>
  );
});

export default App;

