import React, {useState} from 'react';
import {AppBar, Avatar, Box, IconButton, Menu, MenuItem, Tab, Tabs, Toolbar, Tooltip, Typography} from '@mui/material';
import {DarkMode, LightMode} from '@mui/icons-material';
import LoginIcon from '@mui/icons-material/Login';
import {useNavigate} from 'react-router-dom';
import authStore from "../stores/AuthStore";
import LogoutDialog from "./dialogs/LogoutDialog";
import {stringToColor} from "./shiftTable/ShiftTable";

export const AppBarComponent = ({darkMode, setDarkMode}: {
    darkMode: boolean,
    setDarkMode: (isDarkMode: boolean) => void
}) => {
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(() => {
        if (window.location.pathname.startsWith('/constraints')) return 1;
        if (window.location.pathname.startsWith('/settings')) return 2;
        return 0;
    });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(anchorEl);
    const [logoutOpen, setLogoutOpen] = useState(false);


    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        if (newValue === 0) navigate('/');
        if (newValue === 1) navigate('/constraints');
        if (newValue === 2) navigate('/settings');
    };

    return <AppBar position="sticky" color="primary" sx={{mb: 2}}>
        <Toolbar sx={{justifyContent: 'space-between'}}>
            <Box sx={{display: 'flex', alignItems: 'center', flex: 1}}>
                <IconButton
                    aria-label="toggle theme"
                    onClick={() => setDarkMode(!darkMode)}
                    size="large"
                >
                    {darkMode ? <LightMode sx={{color: '#ffe066'}}/> : <DarkMode sx={{color: '#23272f'}}/>}
                </IconButton>
                <Box sx={{flex: 1, display: 'flex', justifyContent: 'center'}}>
                    <Tabs value={tabValue} onChange={handleTabChange} textColor="inherit"
                          indicatorColor="secondary">
                        <Tab label="שיבוצים"/>
                        <Tab label="אילוצים"/>
                        <Tab label="הגדרות"/>
                    </Tabs>
                </Box>
                {!authStore.isAuthenticated() && (
                    <IconButton aria-label="login" color="inherit" onClick={() => navigate('/login')}>
                        <LoginIcon/>
                    </IconButton>
                )}
                {authStore.isAuthenticated() && (
                    <>
                        {authStore.username &&
                            <Tooltip title="אפשרויות משתמש">
                                <Avatar sx={{bgcolor: stringToColor(authStore.username), cursor: 'pointer'}}
                                        onClick={e => setAnchorEl(e.currentTarget)}>
                                    <Typography variant={"button"} sx={{color: 'common.white'}}>
                                        {authStore.username[0]}
                                    </Typography>
                                </Avatar>
                            </Tooltip>
                        }
                        <Menu
                            anchorEl={anchorEl}
                            open={menuOpen}
                            onClose={() => setAnchorEl(null)}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                            transformOrigin={{vertical: 'top', horizontal: 'right'}}
                        >
                            <MenuItem onClick={() => {
                                setAnchorEl(null);
                                setLogoutOpen(true);
                            }}>יציאה</MenuItem>
                        </Menu>
                    </>
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
            </Box>
        </Toolbar>
    </AppBar>
}