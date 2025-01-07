import { useMagic } from '../MagicProvider';
import showToast from '@/utils/showToast';
import Spinner from '../../ui/Spinner';
import { LoginProps } from '@/utils/types';
import Card from '../../ui/Card';
import CardHeader from '../../ui/CardHeader';
import { useState } from 'react';
import { saveToken } from '@/utils/common';

const SpireKey = ({ setToken }: LoginProps) => {
  const { magic } = useMagic();
  const [isLoginInProgress, setLoginInProgress] = useState(false);

  const handleLogin = async () => {
    try {
      setLoginInProgress(true);
      const response = await magic?.kadena.loginWithSpireKey();
      if (response) {
        saveToken(response.accountName, setToken, 'SPIREKEY');
      }
    } catch (e) {
      console.log('login error: ' + JSON.stringify(e));
      if (e instanceof Error) {
        showToast({
          message: e.message,
          type: 'error',
        });
      } else {
        showToast({
          message: 'An unknown error occurred',
          type: 'error',
        });
      }
    } finally {
      setLoginInProgress(false);
    }
  };

  return (
    <Card>
      <CardHeader id="login">SpireKey Login</CardHeader>
      <button className="login-button" onClick={() => handleLogin()}>
        {isLoginInProgress ? <Spinner /> : 'Log in'}
      </button>
    </Card>
  );
};

export default SpireKey;
