import React, { useState } from 'react';
import { Box, Button, Paper, Tab, Tabs, TextField, Typography, Alert } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import authStore from '../stores/AuthStore';

const LoginSignup: React.FC = observer(() => {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTabChange = (_: any, newValue: number) => {
    setTab(newValue);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const endpoint = tab === 0 ? '/auth/login' : '/auth/signup';
      const res = await fetch(`${config.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'An error occurred');
      authStore.setUsername(username);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper elevation={6} sx={{ p: 4, minWidth: 340, maxWidth: 380, borderRadius: 4, background: 'rgba(34,34,34,0.97)' }}>
        <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 2 }}>
          <Tab label="התחברות" />
          <Tab label="הרשמה" />
        </Tabs>
        <Typography variant="h5" align="center" fontWeight={700} color="#61dafb" sx={{ mb: 2 }}>
          {tab === 0 ? 'התחברות למערכת' : 'הרשמה למערכת'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="שם משתמש"
            variant="outlined"
            fullWidth
            value={username}
            onChange={e => setUsername(e.target.value)}
            sx={{ mb: 2 }}
            autoFocus
            required
          />
          <TextField
            label="סיסמה"
            variant="outlined"
            type="password"
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ fontWeight: 700, fontSize: '1.1em', py: 1 }}
          >
            {tab === 0 ? 'התחבר' : 'הרשם'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
});

export default LoginSignup;
