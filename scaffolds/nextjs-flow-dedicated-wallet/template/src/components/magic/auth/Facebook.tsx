import { LoginProps } from '@/utils/types';
import { useMagic } from '../MagicProvider';
import { useEffect, useState } from 'react';
import { saveToken } from '@/utils/common';
import Spinner from '@/components/ui/Spinner';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import CardHeader from '@/components/ui/CardHeader';

const Facebook = ({ token, setToken }: LoginProps) => {
  const { magic } = useMagic();
  const [isAuthLoading, setIsAuthLoading] = useState<string | null>(null);

  useEffect(() => {
    setIsAuthLoading(localStorage.getItem('isAuthLoading'));
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        if (magic) {
          const result = await magic?.oauth.getRedirectResult();
          //do stuff with user profile data
          saveToken(result.magic.idToken, setToken, 'SOCIAL');
          setLoadingFlag('false');
        }
      } catch (e) {
        console.log('social login error: ' + e);
        setLoadingFlag('false');
      }
    };

    checkLogin();
  }, [magic, setToken]);

  const login = async () => {
    setLoadingFlag('true');
    await magic?.oauth.loginWithRedirect({
      provider: 'facebook',
      redirectURI: window.location.origin,
    });
  };

  const setLoadingFlag = (loading: string) => {
    localStorage.setItem('isAuthLoading', loading);
    setIsAuthLoading(loading);
  };

  return (
    <Card>
      <CardHeader id="facebook">Facebook Login</CardHeader>
      {isAuthLoading && isAuthLoading !== 'false' ? (
        <Spinner />
      ) : (
        <div className="login-method-grid-item-container">
          <button
            className="social-login-button"
            onClick={() => {
              if (token.length == 0) login();
            }}
            disabled={false}
          >
            <Image src="/social/Facebook.svg" alt="Facebook" height={24} width={24} className="mr-6" />
            <div className="text-xs font-semibold text-center w-full">Continue with Facebook</div>
          </button>
        </div>
      )}
    </Card>
  );
};
export default Facebook;
