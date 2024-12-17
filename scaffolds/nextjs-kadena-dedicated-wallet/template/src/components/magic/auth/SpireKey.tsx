import { useMagic } from '../MagicProvider';
import showToast from '@/utils/showToast';
import Spinner from '../../ui/Spinner';
import { LoginProps } from '@/utils/types';
import Card from '../../ui/Card';
import CardHeader from '../../ui/CardHeader';
import { useState } from 'react';

const SpireKey = ({ token, setToken }: LoginProps) => {
  const { magic } = useMagic();
  const [isLoginInProgress, setLoginInProgress] = useState(false);

  const handleLogin = async () => {
      try {
        setLoginInProgress(true);
        await magic?.kadena.loginWithSpireKey();
      } catch (e) {
        console.log('login error: ' + JSON.stringify(e));
        showToast({
          message: 'Something went wrong. Please try again',
          type: 'error',
        });
      } finally {
        setLoginInProgress(false);
      }
    
  };

  return (
    <Card>
      <CardHeader id="login">SpireKey Login</CardHeader>
      <div className="login-method-grid-item-container">
        <button
          className="login-button"
          disabled={isLoginInProgress || token.length === 0}
          onClick={() => handleLogin()}
        >
          {isLoginInProgress ? <Spinner /> : 'Log in / Sign up'}
        </button>
      </div>
    </Card>
  );
};

export default SpireKey;
