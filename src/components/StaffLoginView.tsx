import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

export const StaffLoginView: React.FC<{ accessDenied?: boolean; authError?: string; recoveryMode?: boolean }> = ({ accessDenied = false, authError = '', recoveryMode = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [error, setError] = useState(authError || (accessDenied ? 'Esta cuenta no tiene acceso al balneario configurado.' : ''));
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError(`No se pudo iniciar sesión (${signInError.code || 'error de Auth'}): ${signInError.message}`);
      } else setMessage('Ingreso correcto. Verificando acceso al balneario...');
    } catch (failure) {
      const detail = failure instanceof Error ? failure.message : 'Error de conexión con Auth.';
      setError(`No se pudo completar el ingreso: ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setIsSubmitting(true);
    setError('');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`,
    });
    if (resetError) {
      if (resetError.code === 'over_email_send_rate_limit') {
        setError('Supabase limitó temporalmente los correos. Esperá una hora desde el último envío y probá una sola vez.');
      } else if (resetError.code === 'email_address_not_authorized') {
        setError('Supabase no permite enviar a esta dirección con el correo de prueba. Configurá un proveedor SMTP en Auth.');
      } else {
        setError(`No se pudo enviar el enlace (${resetError.code || 'error de Auth'}): ${resetError.message}`);
      }
    } else setMessage('Si el usuario existe, recibirá un correo para establecer una contraseña nueva.');
    setIsSubmitting(false);
  };

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setMessage('Actualizando la contraseña...');
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setMessage('');
        setError(`No se pudo actualizar la contraseña (${updateError.code || 'error de Auth'}): ${updateError.message}`);
        return;
      }
      setMessage('Contraseña actualizada. Entrando a Gestión Balnearia...');
    } catch (updateFailure) {
      const detail = updateFailure instanceof Error ? updateFailure.message : 'Error de conexión con Auth.';
      setMessage('');
      setError(`No se pudo completar el cambio: ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRecoveryForm = recoveryMode;
  const isResetRequestForm = !recoveryMode && isRequestingReset;

  return (
    <div className="min-h-screen sand-textured-bg flex items-center justify-center p-4 text-[#0F172A]">
      <form onSubmit={isRecoveryForm ? handleUpdatePassword : isResetRequestForm ? handleRequestReset : handleSubmit} className="w-full max-w-sm rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-black">{isRecoveryForm ? 'Crear contraseña nueva' : isResetRequestForm ? 'Recuperar contraseña' : 'Acceso del personal'}</h1>
          <p className="text-xs text-gray-500">MDP BEACH &amp; RESORT</p>
        </div>
        {!isRecoveryForm && <label className="block space-y-1 text-xs font-bold">
          Email
          <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm font-normal" />
        </label>}
        {!isResetRequestForm && <label className="block space-y-1 text-xs font-bold">
          {isRecoveryForm ? 'Nueva contraseña' : 'Contraseña'}
          <input type="password" autoComplete={isRecoveryForm ? 'new-password' : 'current-password'} minLength={isRecoveryForm ? 8 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm font-normal" />
        </label>}
        {isRecoveryForm && <label className="block space-y-1 text-xs font-bold">
          Confirmar contraseña
          <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm font-normal" />
        </label>}
        {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
        {message && <p role="status" className="text-xs font-semibold text-emerald-700">{message}</p>}
        <button type="submit" disabled={isSubmitting || !supabase} className="w-full rounded-xl bg-[#0284C7] hover:bg-[#0369A1] px-4 py-2.5 text-xs font-black text-white disabled:opacity-50 transition">
          {isSubmitting ? 'Procesando...' : isRecoveryForm ? 'Guardar contraseña nueva' : isResetRequestForm ? 'Enviar enlace de recuperación' : 'Ingresar a Gestión Balnearia'}
        </button>
        {!isRecoveryForm && <button type="button" onClick={() => { setIsRequestingReset((current) => !current); setError(''); setMessage(''); }} className="w-full text-xs font-bold text-[#0284C7] hover:underline">
          {isResetRequestForm ? 'Volver al inicio de sesión' : 'Olvidé mi contraseña'}
        </button>}
      </form>
    </div>
  );
};
