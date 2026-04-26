"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IceCream2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'user' | 'pass' | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        toast.success('¡Bienvenido!');
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al iniciar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafafa',
      position: 'relative'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '3rem 2.5rem',
          textAlign: 'center'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #f472b6 0%, #a855f7 50%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 20px 40px rgba(168, 85, 247, 0.25)'
          }}
        >
          <IceCream2 size={32} color="white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            color: '#171717',
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}
        >
          Koolt POS
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            color: '#737373',
            fontSize: '0.875rem',
            marginBottom: '2.5rem'
          }}
        >
          Ingresa a tu cuenta
        </motion.p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div style={{
              position: 'relative',
              background: focused === 'user' ? '#ffffff' : '#f4f4f5',
              borderRadius: 16,
              border: `1px solid ${focused === 'user' ? '#a855f7' : '#e4e4e7'}`,
              transition: 'all 0.2s'
            }}>
              <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onFocus={() => setFocused('user')}
                onBlur={() => setFocused(null)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#171717',
                  fontSize: '1rem',
                  outline: 'none',
                  textAlign: 'center'
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div style={{
              position: 'relative',
              background: focused === 'pass' ? '#ffffff' : '#f4f4f5',
              borderRadius: 16,
              border: `1px solid ${focused === 'pass' ? '#a855f7' : '#e4e4e7'}`,
              transition: 'all 0.2s'
            }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused(null)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#171717',
                  fontSize: '1rem',
                  outline: 'none',
                  textAlign: 'center'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '1.125rem',
              background: 'linear-gradient(135deg, #f472b6 0%, #a855f7 100%)',
              border: 'none',
              borderRadius: 16,
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}